export type BaseLang = 'ru' | 'uk' | 'en';
export type Lang = BaseLang | 'mix';
export type ChatMode = 'calm' | 'active' | 'hyper';
export type Theme = 'general' | 'poker' | 'gaming' | 'music' | 'irl';
export type FacingMode = 'user' | 'environment';

export interface Profile {
  id: string;
  username: string;
  lang: BaseLang;
  /** Оттенок градиента аватарки, 0–359. */
  hue: number;
  initials: string;
  /** Вариант оформления аватарки (0–4). */
  style: number;
  glyph?: string;
  /** Изображение аватарки (только для стримера). */
  image?: string;
}

export type MessageKind = 'comment' | 'join' | 'own' | 'scripted';

export interface ChatMessage {
  id: string;
  profile: Profile;
  text: string;
  kind: MessageKind;
  replyTo?: string;
  ts: number;
}

export interface Settings {
  streamerName: string;
  streamerAvatar: string | null;
  viewersInitial: number;
  viewersMin: number;
  viewersMax: number;
  /** 0..1 — как часто обновляется счётчик. */
  viewerSpeed: number;
  /** 0..1 — амплитуда колебаний. */
  viewerVolatility: number;
  chatMode: ChatMode;
  lang: Lang;
  theme: Theme;
  hearts: boolean;
  showJoins: boolean;
  facing: FacingMode;
  paused: boolean;
}

export type Listener = () => void;
