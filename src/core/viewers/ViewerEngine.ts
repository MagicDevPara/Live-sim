import { Emitter } from '../storage';
import { clamp, gaussian, type Rng } from '../rng';

export interface ViewerConfig {
  initial: number;
  min: number;
  max: number;
  /** 0..1 — частота обновлений. */
  speed: number;
  /** 0..1 — амплитуда колебаний. */
  volatility: number;
}

export const VIEWER_LIMIT_MIN = 1;
export const VIEWER_LIMIT_MAX = 1_000_000;

export function normalizeViewerConfig(c: ViewerConfig): ViewerConfig {
  const r = (n: number, fb: number) => (Number.isFinite(n) ? Math.round(n) : fb);
  let min = clamp(r(c.min, 1), VIEWER_LIMIT_MIN, VIEWER_LIMIT_MAX);
  let max = clamp(r(c.max, min), VIEWER_LIMIT_MIN, VIEWER_LIMIT_MAX);
  if (min > max) [min, max] = [max, min];
  return {
    min,
    max,
    initial: clamp(r(c.initial, min), min, max),
    speed: clamp(Number.isFinite(c.speed) ? c.speed : 0.5, 0, 1),
    volatility: clamp(Number.isFinite(c.volatility) ? c.volatility : 0.4, 0, 1),
  };
}

interface Ramp {
  from: number;
  to: number;
  start: number;
  duration: number;
}

/**
 * Плавный счётчик зрителей.
 * «Якорь» медленно дрейфует, цель случайно блуждает вокруг якоря, а видимое значение
 * мягко догоняет цель с ограничением шага — число меняется постепенно, без скачков.
 */
export class ViewerEngine extends Emitter {
  private cfg: ViewerConfig;
  private value: number;
  private target: number;
  private anchor: number;
  private ramp: Ramp | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(cfg: ViewerConfig, private rng: Rng = Math.random, private now: () => number = Date.now) {
    super();
    this.cfg = normalizeViewerConfig(cfg);
    this.value = this.target = this.anchor = this.cfg.initial;
  }

  getSnapshot = (): number => this.value;

  get config(): ViewerConfig {
    return this.cfg;
  }

  configure(cfg: ViewerConfig, reset = false): void {
    const prevInitial = this.cfg.initial;
    this.cfg = normalizeViewerConfig(cfg);
    if (reset || this.cfg.initial !== prevInitial) {
      this.ramp = null;
      this.value = this.target = this.anchor = this.cfg.initial;
      this.emit();
      return;
    }
    const { min, max } = this.bounds();
    this.anchor = clamp(this.anchor, min, max);
    this.target = clamp(this.target, min, max);
    const v = Math.round(clamp(this.value, min, max));
    if (v !== this.value) {
      this.value = v;
      this.emit();
    }
  }

  /** Плавно привести счётчик к значению за указанное время (используется сценариями). */
  rampTo(to: number, durationMs: number): void {
    const target = clamp(Math.round(to), VIEWER_LIMIT_MIN, VIEWER_LIMIT_MAX);
    // Расширяем диапазон, чтобы цель сценария не упиралась в настройки.
    this.cfg = {
      ...this.cfg,
      min: Math.min(this.cfg.min, Math.max(1, Math.round(target * 0.97))),
      max: Math.max(this.cfg.max, Math.min(VIEWER_LIMIT_MAX, Math.round(target * 1.03))),
    };
    this.ramp = { from: this.anchor, to: target, start: this.now(), duration: Math.max(0, durationMs) };
    if (durationMs <= 0) {
      this.ramp = null;
      this.anchor = this.target = this.value = target;
      this.emit();
    }
  }

  start(): void {
    if (this.timer) return;
    this.schedule();
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private bounds(): { min: number; max: number } {
    return { min: this.cfg.min, max: this.cfg.max };
  }

  /** Один шаг симуляции; публичный для тестов. */
  step(): number {
    const { volatility } = this.cfg;
    const { min, max } = this.bounds();

    if (this.ramp) {
      const p = clamp((this.now() - this.ramp.start) / this.ramp.duration, 0, 1);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      this.anchor = this.ramp.from + (this.ramp.to - this.ramp.from) * eased;
      if (p >= 1) this.ramp = null;
    } else {
      // Медленный дрейф якоря внутри диапазона.
      this.anchor = clamp(this.anchor + gaussian(this.rng) * this.anchor * 0.0008, min, max);
    }

    const scale = Math.max(1, this.anchor);
    const sigma = scale * (0.0005 + volatility * 0.004) + (0.6 + volatility * 1.5);

    this.target = clamp(
      this.target + gaussian(this.rng) * sigma * 1.6 + (this.anchor - this.target) * (this.ramp ? 0.5 : 0.06),
      min,
      max,
    );

    const prev = this.value;
    let next = prev + (this.target - prev) * 0.35 + gaussian(this.rng) * sigma * 0.2;
    const maxStep = this.ramp
      ? Math.max(5, Math.abs(this.ramp.to - this.ramp.from) * 0.12)
      : Math.max(2, scale * (0.0015 + volatility * 0.008));
    next = prev + clamp(next - prev, -maxStep, maxStep);
    this.value = Math.round(clamp(next, min, max));
    if (this.value !== prev) this.emit();
    return this.value;
  }

  private schedule(): void {
    const base = 2300 - this.cfg.speed * 1800; // 2.3 c … 0.5 c
    const delay = base * (0.6 + this.rng() * 0.8);
    this.timer = setTimeout(() => {
      this.step();
      this.schedule();
    }, delay);
  }
}

export function formatViewers(n: number): string {
  // Пробелы между разрядами как в интерфейсах стримингов: 75 130
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
