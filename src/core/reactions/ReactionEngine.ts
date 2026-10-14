import type { ChatMode } from '../types';

const COLORS = ['#ff3b5c', '#ff5c8a', '#ff7a45', '#ffb020', '#ff4d6d', '#c86bfa', '#4f8cff', '#ff2d55'];
const RATE: Record<ChatMode, number> = { calm: 0.45, active: 1.4, hyper: 3.6 }; // сердечек в секунду
const MAX_ALIVE = 26;

const HEART_SVG =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

/**
 * Анимированные сердечки без участия React: элементы создаются напрямую в DOM,
 * анимируются только transform/opacity (на GPU) и удаляются по окончании анимации.
 */
export class ReactionEngine {
  private host: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private alive = 0;
  private mode: ChatMode = 'active';
  private enabled = false;

  attach(host: HTMLElement | null): void {
    this.host = host;
  }

  setMode(mode: ChatMode): void {
    this.mode = mode;
  }

  setEnabled(v: boolean): void {
    if (v === this.enabled) return;
    this.enabled = v;
    if (v) this.loop();
    else if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  burst(count = 4): void {
    for (let i = 0; i < count; i++) setTimeout(() => this.spawn(), i * 90);
  }

  destroy(): void {
    this.setEnabled(false);
    this.host?.replaceChildren();
    this.alive = 0;
  }

  private loop(): void {
    if (!this.enabled) return;
    const mean = 1000 / RATE[this.mode];
    const delay = -Math.log(1 - Math.random()) * mean;
    this.timer = setTimeout(() => {
      // Пока вкладка скрыта, не накапливаем анимации.
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        const n = Math.random() < 0.15 ? 2 : 1;
        for (let i = 0; i < n; i++) this.spawn();
      }
      this.loop();
    }, Math.min(delay, mean * 4));
  }

  private spawn(): void {
    const host = this.host;
    if (!host || this.alive >= MAX_ALIVE) return;
    const el = document.createElement('div');
    el.className = 'heart';
    const dx = (Math.random() - 0.5) * 70;
    const dy = -(host.clientHeight * (0.65 + Math.random() * 0.3));
    const size = 24 + Math.random() * 12;
    el.style.setProperty('--dx', `${dx.toFixed(1)}px`);
    el.style.setProperty('--dy', `${dy.toFixed(1)}px`);
    el.style.setProperty('--dur', `${(2.4 + Math.random() * 1.4).toFixed(2)}s`);
    el.style.setProperty('--sway', `${(6 + Math.random() * 10).toFixed(1)}px`);
    el.style.setProperty('--s', (0.8 + Math.random() * 0.4).toFixed(2));
    el.style.width = el.style.height = `${size.toFixed(0)}px`;
    el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.innerHTML = `<div class="heart-inner">${HEART_SVG}</div>`;
    el.addEventListener('animationend', (e) => {
      if (e.target !== el) return;
      el.remove();
      this.alive--;
    });
    this.alive++;
    host.appendChild(el);
  }
}
