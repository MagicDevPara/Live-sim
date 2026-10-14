import type { FacingMode } from '../types';
import { Emitter } from '../storage';

export type CameraStatus = 'idle' | 'starting' | 'live' | 'error';

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  facing: FacingMode;
  error: string | null;
}

export function describeCameraError(e: unknown): string {
  const name = (e as { name?: string })?.name ?? '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Доступ к камере запрещён. Откройте «Настройки → Safari → Камера» (или значок «аА» в адресной строке) и разрешите доступ, затем нажмите «Повторить».';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Камера не найдена на этом устройстве.';
    case 'NotReadableError':
    case 'AbortError':
      return 'Камера занята другим приложением (FaceTime, звонок, другая вкладка). Закройте его и нажмите «Повторить».';
    default:
      return 'Не удалось запустить камеру. Нажмите «Повторить».';
  }
}

/**
 * Управляет MediaStream: запуск, переключение фронтальная/основная, перезапуск
 * после блокировки экрана (iOS останавливает дорожку, когда страница уходит в фон).
 */
export class CameraManager extends Emitter {
  private state: CameraState = { status: 'idle', stream: null, facing: 'user', error: null };
  private active = false;
  private reqId = 0;

  constructor() {
    super();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisible);
      window.addEventListener('pageshow', this.onVisible);
    }
  }

  getSnapshot = (): CameraState => this.state;

  private set(patch: Partial<CameraState>): void {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  async start(facing: FacingMode = this.state.facing): Promise<void> {
    this.active = true;
    const id = ++this.reqId;

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      this.set({ status: 'error', facing, error: 'Камера работает только по HTTPS. Откройте сайт по адресу, начинающемуся с https://.' });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.set({ status: 'error', facing, error: 'Этот браузер не поддерживает доступ к камере. Откройте сайт в Safari.' });
      return;
    }

    // На iOS новую камеру можно открыть только после остановки старой.
    this.releaseTracks();
    this.set({ status: 'starting', facing, error: null, stream: null });

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        });
      } catch (e) {
        if ((e as { name?: string })?.name !== 'OverconstrainedError') throw e;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      if (id !== this.reqId || !this.active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (this.state.stream === stream && document.visibilityState === 'visible') this.restart();
      });
      this.set({ status: 'live', stream, error: null });
    } catch (e) {
      if (id !== this.reqId) return;
      this.set({ status: 'error', error: describeCameraError(e), stream: null });
    }
  }

  switchFacing(): Promise<void> {
    return this.start(this.state.facing === 'user' ? 'environment' : 'user');
  }

  restart(): Promise<void> {
    return this.start(this.state.facing);
  }

  stop(): void {
    this.active = false;
    this.reqId++;
    this.releaseTracks();
    this.set({ status: 'idle', stream: null, error: null });
  }

  private releaseTracks(): void {
    this.state.stream?.getTracks().forEach((t) => t.stop());
  }

  private onVisible = (): void => {
    if (!this.active || document.visibilityState !== 'visible') return;
    if (this.state.status !== 'live') return;
    const s = this.state.stream;
    const ended = !s || s.getVideoTracks().every((t) => t.readyState === 'ended');
    if (ended) {
      void this.restart();
      return;
    }
    // После разблокировки iOS иногда держит дорожку «muted» — если не ожила сама, перезапускаем.
    setTimeout(() => {
      if (!this.active || this.state.stream !== s || document.visibilityState !== 'visible') return;
      if (s.getVideoTracks().every((t) => t.muted || t.readyState === 'ended')) void this.restart();
    }, 1500);
  };
}
