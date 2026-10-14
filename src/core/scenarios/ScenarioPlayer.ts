import { Emitter } from '../storage';
import type { ScenarioEvent } from './scenarioScript';

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface PlayerState {
  status: PlayerStatus;
  scenarioId: string | null;
  index: number;
  total: number;
  durationMs: number;
}

const IDLE: PlayerState = { status: 'idle', scenarioId: null, index: 0, total: 0, durationMs: 0 };

/** Воспроизводит события сценария по таймлайну; поддерживает паузу, продолжение и скорость. */
export class ScenarioPlayer extends Emitter {
  private state: PlayerState = IDLE;
  private events: ScenarioEvent[] = [];
  private speed = 1;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private elapsedBeforePause = 0;
  private resumedAt = 0;

  constructor(
    private onEvent: (e: ScenarioEvent) => void,
    private onStatus?: (s: PlayerStatus) => void,
    private now: () => number = () => performance.now(),
  ) {
    super();
  }

  getSnapshot = (): PlayerState => this.state;

  /** Время сценария (с учётом скорости), мс. */
  elapsed(): number {
    const raw = this.state.status === 'playing' ? this.elapsedBeforePause + (this.now() - this.resumedAt) : this.elapsedBeforePause;
    return raw * this.speed;
  }

  play(scenarioId: string, events: ScenarioEvent[], speed = 1): void {
    this.clearTimer();
    this.events = events;
    this.speed = Math.min(Math.max(speed, 0.25), 4);
    this.elapsedBeforePause = 0;
    this.resumedAt = this.now();
    const durationMs = events.length ? events[events.length - 1].at : 0;
    this.setState({ status: 'playing', scenarioId, index: 0, total: events.length, durationMs });
    this.scheduleNext();
  }

  pause(): void {
    if (this.state.status !== 'playing') return;
    this.elapsedBeforePause += this.now() - this.resumedAt;
    this.clearTimer();
    this.setState({ ...this.state, status: 'paused' });
  }

  resume(): void {
    if (this.state.status !== 'paused') return;
    this.resumedAt = this.now();
    this.setState({ ...this.state, status: 'playing' });
    this.scheduleNext();
  }

  stop(): void {
    this.clearTimer();
    this.elapsedBeforePause = 0;
    if (this.state.status !== 'idle') this.setState(IDLE);
  }

  private setState(s: PlayerState): void {
    const prev = this.state.status;
    this.state = s;
    this.emit();
    if (prev !== s.status) this.onStatus?.(s.status);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private scheduleNext(): void {
    if (this.state.status !== 'playing') return;
    const ev = this.events[this.state.index];
    if (!ev) {
      this.elapsedBeforePause += this.now() - this.resumedAt;
      this.setState({ ...this.state, status: 'finished' });
      return;
    }
    const wait = Math.max(0, (ev.at - this.elapsed()) / this.speed);
    this.timer = setTimeout(() => {
      if (this.state.status !== 'playing') return;
      this.onEvent(ev);
      this.setState({ ...this.state, index: this.state.index + 1 });
      this.scheduleNext();
    }, wait);
  }
}
