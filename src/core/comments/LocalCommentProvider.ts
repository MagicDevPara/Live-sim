import type { BaseLang, Lang, Profile, Theme } from '../types';
import type { CommentContext, CommentProvider, GeneratedComment } from './CommentProvider';
import { EMOJI_MESSAGES, PHRASES, PREFIXES, TAIL_EMOJI, THEME_PHRASES, type Category } from '../data/phrases';
import { CITIES } from '../data/names';
import { chance, pick, randInt, weighted, type Rng } from '../rng';
import { getProfiles } from './profiles';

const BASE_WEIGHTS: Record<Category, number> = {
  greeting: 9,
  reaction: 17,
  question: 10,
  joke: 6,
  emoji: 13,
  discussion: 16,
  interaction: 10,
  compliment: 8,
  argue: 3,
  random: 6,
};

const MIX_WEIGHTS: Record<BaseLang, number> = { ru: 45, uk: 37, en: 18 };
const REGULARS_PER_LANG = 28;
const DEDUPE_WINDOW = 140;

/** Полностью локальный генератор: шаблоны + вариативность + «постоянные» зрители + ответы друг другу. */
export class LocalCommentProvider implements CommentProvider {
  readonly id = 'local';
  private byLang: Record<BaseLang, Profile[]>;
  private regulars: Record<BaseLang, Profile[]>;
  private recentTexts: string[] = [];
  private recentSet = new Set<string>();
  private recentAuthors: string[] = [];

  constructor(
    private rng: Rng = Math.random,
    profiles: Profile[] = getProfiles(),
  ) {
    this.byLang = { ru: [], uk: [], en: [] };
    for (const p of profiles) this.byLang[p.lang].push(p);
    this.regulars = { ru: [], uk: [], en: [] };
    this.reset();
  }

  reset(): void {
    this.recentTexts = [];
    this.recentSet.clear();
    this.recentAuthors = [];
    for (const lang of ['ru', 'uk', 'en'] as BaseLang[]) {
      const pool = this.byLang[lang];
      const set = new Set<Profile>();
      while (set.size < Math.min(REGULARS_PER_LANG, pool.length)) set.add(pick(pool, this.rng));
      this.regulars[lang] = [...set];
    }
  }

  async next(ctx: CommentContext): Promise<GeneratedComment[]> {
    return this.generate(ctx);
  }

  /** Синхронная генерация (удобна для тестов). */
  generate(ctx: CommentContext): GeneratedComment[] {
    const lang = this.pickLang(ctx.lang);
    const profile = this.pickProfile(lang);

    if (ctx.allowJoins && chance(ctx.sessionMs < 60_000 ? 0.14 : 0.07, this.rng)) {
      return [{ profile, text: '', kind: 'join' }];
    }

    const first = this.compose(ctx, profile, lang, this.pickCategory(ctx, profile));
    const out: GeneratedComment[] = [first];

    // Серия: тот же зритель дописывает ещё 1–2 коротких сообщения.
    if (chance(0.11, this.rng)) {
      const extra = randInt(1, 2, this.rng);
      for (let i = 0; i < extra; i++) {
        const cat = pick<Category>(['reaction', 'emoji', 'random', 'question'], this.rng);
        const c = this.compose(ctx, profile, lang, cat);
        c.delayMs = randInt(700, 2200, this.rng);
        out.push(c);
      }
    }
    return out;
  }

  private pickLang(lang: Lang): BaseLang {
    return lang === 'mix' ? weighted(MIX_WEIGHTS, this.rng) : lang;
  }

  private pickProfile(lang: BaseLang): Profile {
    for (let attempt = 0; attempt < 4; attempt++) {
      const p = chance(0.38, this.rng) ? pick(this.regulars[lang], this.rng) : pick(this.byLang[lang], this.rng);
      // Не даём одному нику писать слишком часто подряд.
      if (!this.recentAuthors.slice(-4).includes(p.username)) {
        this.recentAuthors.push(p.username);
        if (this.recentAuthors.length > 12) this.recentAuthors.shift();
        return p;
      }
    }
    return pick(this.byLang[lang], this.rng);
  }

  private pickCategory(ctx: CommentContext, profile: Profile): Category {
    const w = { ...BASE_WEIGHTS };
    if (ctx.sessionMs < 45_000) w.greeting = 34;
    else if (ctx.sessionMs > 300_000) w.greeting = 4;
    const others = ctx.recent.filter((m) => m.kind !== 'join' && m.profile.username !== profile.username);
    if (others.length === 0) {
      w.interaction = 0;
      w.argue = 0;
    }
    return weighted(w, this.rng);
  }

  private compose(ctx: CommentContext, profile: Profile, lang: BaseLang, category: Category): GeneratedComment {
    let replyTo: string | undefined;
    let text = '';

    for (let attempt = 0; attempt < 8; attempt++) {
      replyTo = undefined;
      text = this.baseText(lang, category, ctx.theme);
      text = this.fill(text, lang, ctx.streamerName);

      if (category === 'interaction' || (category === 'argue' && chance(0.6, this.rng))) {
        const target = this.pickReplyTarget(ctx, profile);
        if (target) {
          replyTo = target;
          text = `@${target} ${text}`;
        }
      }
      if (category !== 'emoji') text = this.vary(text, lang, category);
      if (!this.recentSet.has(this.key(text)) || attempt === 7) break;
    }

    this.remember(text);
    return { profile, text, kind: 'comment', replyTo };
  }

  private baseText(lang: BaseLang, category: Category, theme: Theme): string {
    if (category === 'emoji') return pick(EMOJI_MESSAGES, this.rng);
    if (theme !== 'general' && (category === 'discussion' || category === 'question') && chance(0.62, this.rng)) {
      return pick(THEME_PHRASES[theme][lang], this.rng);
    }
    return pick(PHRASES[lang][category], this.rng);
  }

  private pickReplyTarget(ctx: CommentContext, self: Profile): string | undefined {
    const candidates = ctx.recent
      .slice(-10)
      .filter((m) => m.kind !== 'join' && m.profile.username !== self.username);
    if (candidates.length === 0) return undefined;
    // Чаще отвечают на самые свежие сообщения.
    const idx = candidates.length - 1 - Math.floor(Math.pow(this.rng(), 2) * candidates.length);
    return candidates[Math.max(0, idx)].profile.username;
  }

  private fill(text: string, lang: BaseLang, streamer: string): string {
    return text
      .replace(/\{s\}/g, streamer || 'бро')
      .replace(/\{u\}/g, () => '@' + pick(this.byLang[lang], this.rng).username)
      .replace(/\{city\}/g, () => pick(CITIES[lang], this.rng))
      .replace(/\{n\}/g, () => String(randInt(2, 30, this.rng)))
      .replace(/\{e\}/g, () => pick(TAIL_EMOJI, this.rng));
  }

  /** Небольшие «человеческие» искажения, чтобы одинаковые шаблоны выглядели по-разному. */
  private vary(text: string, lang: BaseLang, category: Category): string {
    let t = text;
    const startsWithMention = t.startsWith('@');
    if (!startsWithMention && category !== 'greeting' && chance(0.07, this.rng)) {
      t = pick(PREFIXES[lang], this.rng) + t[0].toLowerCase() + t.slice(1);
    }
    if (!startsWithMention && chance(0.35, this.rng)) t = t[0].toLowerCase() + t.slice(1);
    if (chance(0.4, this.rng)) t = t.replace(/[.!]+$/u, '');
    if (t.length < 14 && chance(0.05, this.rng)) {
      t = t.replace(/([аеиоуыэюяaeiouіїє])([^аеиоуыэюяaeiouіїє]*)$/iu, (_m, v: string, rest: string) => v.repeat(3) + rest);
    }
    if (t.length < 12 && category === 'reaction' && chance(0.06, this.rng)) t = t.toUpperCase();
    if (chance(0.22, this.rng)) {
      const e = pick(TAIL_EMOJI, this.rng);
      t = `${t} ${chance(0.25, this.rng) ? e + e : e}`;
    }
    return t;
  }

  private key(text: string): string {
    return text.toLowerCase().replace(/^@\S+\s*/, '').replace(/[^\p{L}\p{N}]+/gu, '');
  }

  private remember(text: string): void {
    const k = this.key(text);
    if (!k) return; // чистые эмодзи не учитываем
    this.recentTexts.push(k);
    this.recentSet.add(k);
    if (this.recentTexts.length > DEDUPE_WINDOW) {
      const old = this.recentTexts.shift()!;
      if (!this.recentTexts.includes(old)) this.recentSet.delete(old);
    }
  }
}
