import type { ChatMessage, ChatMode, Lang, Profile, Theme } from '../types';
import type { CommentProvider, GeneratedComment } from './CommentProvider';
import { Emitter } from '../storage';
import { clamp } from '../rng';
import { profileFromUsername } from './profiles';

export interface ChatConfig {
  mode: ChatMode;
  lang: Lang;
  theme: Theme;
  streamerName: string;
  allowJoins: boolean;
}

/** Средний интервал между сообщениями, мс. */
export const MODE_INTERVAL: Record<ChatMode, number> = { calm: 1700, active: 650, hyper: 230 };
const MAX_MESSAGES = 30;

/**
 * Отвечает за ритм чата: нерегулярные интервалы, «волны» активности, паузы.
 * Содержание сообщений берёт у CommentProvider (локального или AI).
 * Хранит не больше MAX_MESSAGES — старые сообщения удаляются из состояния и из DOM.
 */
export class CommentEngine extends Emitter {
  private messages: ChatMessage[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private burstTimers = new Set<ReturnType<typeof setTimeout>>();
  private running = false;
  private paused = false;
  private suspended = false;
  private inflight = false;
  private modeOverride: ChatMode | null = null;
  private startedAt = 0;
  private seq = 0;

  constructor(
    private provider: CommentProvider,
    private getConfig: () => ChatConfig,
    private rng: () => number = Math.random,
  ) {
    super();
  }

  getSnapshot = (): ChatMessage[] => this.messages;

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startedAt = Date.now();
    this.provider.reset?.();
    this.schedule(500);
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.burstTimers.forEach(clearTimeout);
    this.burstTimers.clear();
  }

  clear(): void {
    this.messages = [];
    this.emit();
  }

  setProvider(p: CommentProvider): void {
    this.provider.dispose?.();
    this.provider = p;
  }

  /** Пауза, выбранная пользователем. */
  setPaused(v: boolean): void {
    this.paused = v;
  }

  /** Временная остановка (например, сценарий с выключенным случайным чатом). */
  setSuspended(v: boolean): void {
    this.suspended = v;
  }

  /** Активность, заданная сценарием; null — вернуть настройку пользователя. */
  setModeOverride(mode: ChatMode | null): void {
    this.modeOverride = mode;
  }

  addOwn(text: string, streamer: Profile): void {
    this.push({ profile: streamer, text, kind: 'own' });
  }

  addScripted(username: string | undefined, text: string, fallbackProfile?: () => Profile): void {
    const profile = username ? profileFromUsername(username) : fallbackProfile?.() ?? profileFromUsername('viewer');
    this.push({ profile, text, kind: 'scripted' });
  }

  private push(c: GeneratedComment): void {
    const msg: ChatMessage = {
      id: `m${++this.seq}`,
      profile: c.profile,
      text: c.text,
      kind: c.kind,
      replyTo: c.replyTo,
      ts: Date.now(),
    };
    const next = this.messages.length >= MAX_MESSAGES ? this.messages.slice(-(MAX_MESSAGES - 1)) : this.messages.slice();
    next.push(msg);
    this.messages = next;
    this.emit();
  }

  private schedule(delay: number): void {
    if (!this.running) return;
    this.timer = setTimeout(this.tick, delay);
  }

  private tick = async (): Promise<void> => {
    if (!this.running) return;
    if (!this.paused && !this.suspended && !this.inflight) {
      this.inflight = true;
      try {
        const cfg = this.getConfig();
        const batch = await this.provider.next({
          lang: cfg.lang,
          theme: cfg.theme,
          streamerName: cfg.streamerName,
          recent: this.messages,
          sessionMs: Date.now() - this.startedAt,
          allowJoins: cfg.allowJoins,
        });
        if (this.running) this.deliver(batch);
      } catch {
        /* провайдер не должен ронять эфир */
      } finally {
        this.inflight = false;
      }
    }
    this.schedule(this.nextDelay());
  };

  private deliver(batch: GeneratedComment[]): void {
    let acc = 0;
    for (const c of batch) {
      acc += c.delayMs ?? 0;
      if (acc === 0) {
        this.push(c);
      } else {
        const t = setTimeout(() => {
          this.burstTimers.delete(t);
          if (this.running && !this.suspended) this.push(c);
        }, acc);
        this.burstTimers.add(t);
      }
    }
  }

  /** Экспоненциальные интервалы + медленная «волна» + редкие затишья. */
  nextDelay(): number {
    const mode = this.modeOverride ?? this.getConfig().mode;
    const mean = MODE_INTERVAL[mode];
    const t = (Date.now() - this.startedAt) / 1000;
    const wave = 1 + 0.35 * Math.sin(t / 23) + 0.15 * Math.sin(t / 7.3);
    let d = -Math.log(1 - this.rng()) * mean * wave;
    if (mode !== 'hyper' && this.rng() < 0.04) d *= 2.5; // короткое затишье
    return Math.round(clamp(d, mean * 0.25, mean * 4));
  }
}
