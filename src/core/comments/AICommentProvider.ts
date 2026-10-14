import type { CommentContext, CommentProvider, GeneratedComment } from './CommentProvider';
import { LocalCommentProvider } from './LocalCommentProvider';
import { profileFromUsername } from './profiles';
import type { BaseLang } from '../types';

/**
 * ЗАГОТОВКА для будущего AI-чата. Сейчас нигде не включена.
 *
 * Браузер обращается только к СВОЕМУ серверному эндпоинту (например, Cloudflare Pages Function
 * `/api/comments`), а уже сервер хранит API-ключ LLM и вызывает модель. Ключ никогда не попадает в браузер.
 *
 * Ожидаемый ответ сервера: { comments: [{ username, text, lang?, replyTo?, delayMs? }] }
 * При любой ошибке провайдер молча переключается на локальную генерацию, чтобы эфир не «замолкал».
 */
export class AICommentProvider implements CommentProvider {
  readonly id = 'ai';
  private fallback = new LocalCommentProvider();
  private failures = 0;

  constructor(
    private endpoint = '/api/comments',
    private timeoutMs = 4000,
  ) {}

  async next(ctx: CommentContext): Promise<GeneratedComment[]> {
    if (this.failures >= 3) return this.fallback.next(ctx);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          lang: ctx.lang,
          theme: ctx.theme,
          streamer: ctx.streamerName,
          transcript: ctx.transcript ?? '',
          recent: ctx.recent.slice(-20).map((m) => ({ user: m.profile.username, text: m.text })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        comments?: { username: string; text: string; lang?: BaseLang; replyTo?: string; delayMs?: number }[];
      };
      this.failures = 0;
      return (data.comments ?? []).map((c) => ({
        profile: profileFromUsername(c.username, c.lang ?? 'ru'),
        text: c.text,
        kind: 'comment' as const,
        replyTo: c.replyTo,
        delayMs: c.delayMs,
      }));
    } catch {
      this.failures++;
      return this.fallback.next(ctx);
    } finally {
      clearTimeout(timer);
    }
  }

  reset(): void {
    this.failures = 0;
    this.fallback.reset();
  }
}
