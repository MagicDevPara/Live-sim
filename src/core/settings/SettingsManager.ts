import type { ChatMode, FacingMode, Lang, Settings, Theme } from '../types';
import { Emitter, readJson, removeKey, writeJson } from '../storage';
import { normalizeViewerConfig } from '../viewers/ViewerEngine';

const KEY = 'livesim.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  streamerName: 'your.name',
  streamerAvatar: null,
  viewersInitial: 1240,
  viewersMin: 980,
  viewersMax: 1600,
  viewerSpeed: 0.5,
  viewerVolatility: 0.4,
  chatMode: 'active',
  lang: 'ru',
  theme: 'general',
  hearts: true,
  showJoins: true,
  facing: 'user',
  paused: false,
};

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fb: T): T =>
  allowed.includes(v as T) ? (v as T) : fb;

export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  const num = (v: unknown, fb: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fb);
  const vc = normalizeViewerConfig({
    initial: num(r.viewersInitial, d.viewersInitial),
    min: num(r.viewersMin, d.viewersMin),
    max: num(r.viewersMax, d.viewersMax),
    speed: num(r.viewerSpeed, d.viewerSpeed),
    volatility: num(r.viewerVolatility, d.viewerVolatility),
  });
  const name = typeof r.streamerName === 'string' ? r.streamerName.trim().slice(0, 30) : '';
  const avatar = typeof r.streamerAvatar === 'string' && r.streamerAvatar.startsWith('data:image/') ? r.streamerAvatar : null;
  return {
    streamerName: name || d.streamerName,
    streamerAvatar: avatar,
    viewersInitial: vc.initial,
    viewersMin: vc.min,
    viewersMax: vc.max,
    viewerSpeed: vc.speed,
    viewerVolatility: vc.volatility,
    chatMode: oneOf<ChatMode>(r.chatMode, ['calm', 'active', 'hyper'], d.chatMode),
    lang: oneOf<Lang>(r.lang, ['ru', 'uk', 'en', 'mix'], d.lang),
    theme: oneOf<Theme>(r.theme, ['general', 'poker', 'gaming', 'music', 'irl'], d.theme),
    hearts: typeof r.hearts === 'boolean' ? r.hearts : d.hearts,
    showJoins: typeof r.showJoins === 'boolean' ? r.showJoins : d.showJoins,
    facing: oneOf<FacingMode>(r.facing, ['user', 'environment'], d.facing),
    paused: typeof r.paused === 'boolean' ? r.paused : d.paused,
  };
}

/** Хранит настройки в localStorage и уведомляет подписчиков. */
export class SettingsManager extends Emitter {
  private settings: Settings;

  constructor() {
    super();
    this.settings = sanitizeSettings(readJson(KEY));
  }

  getSnapshot = (): Settings => this.settings;

  update(patch: Partial<Settings>): void {
    this.settings = sanitizeSettings({ ...this.settings, ...patch });
    writeJson(KEY, this.settings);
    this.emit();
  }

  reset(): void {
    removeKey(KEY);
    this.settings = { ...DEFAULT_SETTINGS };
    this.emit();
  }
}

/** Пресеты аудитории: начальное значение и коридор ±. */
export const VIEWER_PRESETS = [
  { label: '120', initial: 120, spread: 0.25 },
  { label: '1 200', initial: 1240, spread: 0.2 },
  { label: '12K', initial: 12_400, spread: 0.12 },
  { label: '75K', initial: 75_000, spread: 0.06 },
  { label: '250K', initial: 250_000, spread: 0.05 },
  { label: '1M', initial: 980_000, spread: 0.02 },
];

/** Уменьшает фото аватарки до 160px, чтобы оно поместилось в localStorage. */
export function resizeImageToDataUrl(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}
