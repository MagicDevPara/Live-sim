import type { ChatMessage, Lang, MessageKind, Profile, Theme } from '../types';

/** Что провайдер знает о текущем эфире. AI-провайдеру сюда же можно добавить расшифровку речи. */
export interface CommentContext {
  lang: Lang;
  theme: Theme;
  streamerName: string;
  /** Последние сообщения чата (новые в конце). */
  recent: readonly ChatMessage[];
  /** Сколько миллисекунд идёт эфир. */
  sessionMs: number;
  allowJoins: boolean;
  /** Необязательно: последняя фраза ведущего (для будущего AI). */
  transcript?: string;
}

export interface GeneratedComment {
  profile: Profile;
  text: string;
  kind: MessageKind;
  replyTo?: string;
  /** Задержка относительно предыдущего комментария пачки — для «серий» сообщений. */
  delayMs?: number;
}

/**
 * Единый интерфейс источника комментариев.
 * CommentEngine отвечает за ритм чата, а провайдер — только за содержание.
 * Поэтому LocalCommentProvider можно заменить на AICommentProvider без изменений UI.
 */
export interface CommentProvider {
  readonly id: string;
  next(ctx: CommentContext): Promise<GeneratedComment[]>;
  reset?(): void;
  dispose?(): void;
}
