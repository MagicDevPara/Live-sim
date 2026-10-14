import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import { generateProfiles } from './comments/profiles';
import { LocalCommentProvider } from './comments/LocalCommentProvider';
import type { CommentContext } from './comments/CommentProvider';
import type { ChatMessage } from './types';
import { ViewerEngine, formatViewers, normalizeViewerConfig } from './viewers/ViewerEngine';
import { parseCount, parseScenarioScript } from './scenarios/scenarioScript';
import { sanitizeScenario } from './scenarios/ScenarioManager';
import { sanitizeSettings } from './settings/SettingsManager';

describe('profiles', () => {
  it('generates ≥1000 unique, varied usernames in three languages', () => {
    const ps = generateProfiles(1200);
    expect(ps.length).toBeGreaterThanOrEqual(1000);
    expect(new Set(ps.map((p) => p.username)).size).toBe(ps.length);
    expect(ps.some((p) => p.username.includes('.'))).toBe(true);
    expect(ps.some((p) => p.username.includes('_'))).toBe(true);
    expect(ps.some((p) => /\d/.test(p.username))).toBe(true);
    for (const l of ['ru', 'uk', 'en'] as const) expect(ps.filter((p) => p.lang === l).length).toBeGreaterThan(300);
  });
});

describe('LocalCommentProvider', () => {
  const run = (lang: CommentContext['lang'], theme: CommentContext['theme'], n: number) => {
    const p = new LocalCommentProvider(mulberry32(7));
    const recent: ChatMessage[] = [];
    const texts: string[] = [];
    const authors = new Map<string, number>();
    let replies = 0;
    for (let i = 0; i < n; i++) {
      const batch = p.generate({ lang, theme, streamerName: 'tester', recent, sessionMs: i * 700, allowJoins: true });
      for (const c of batch) {
        const m: ChatMessage = { id: String(recent.length), ts: 0, ...c };
        recent.push(m);
        if (recent.length > 30) recent.shift();
        if (c.kind === 'comment') {
          texts.push(c.text);
          if (c.replyTo) replies++;
          authors.set(c.profile.username, (authors.get(c.profile.username) ?? 0) + 1);
        }
      }
    }
    return { texts, authors, replies };
  };

  it('avoids near-term repeats', () => {
    const { texts } = run('ru', 'general', 600);
    const key = (t: string) => t.toLowerCase().replace(/^@\S+\s*/, '').replace(/[^\p{L}\p{N}]+/gu, '');
    const keyed = texts.map(key).filter(Boolean);
    let dupes = 0;
    for (let i = 0; i < keyed.length; i++) {
      if (keyed.slice(Math.max(0, i - 40), i).includes(keyed[i])) dupes++;
    }
    expect(dupes / keyed.length).toBeLessThan(0.03);
  });

  it('has returning viewers and replies between viewers', () => {
    const { authors, replies } = run('uk', 'general', 600);
    expect([...authors.values()].some((c) => c >= 5)).toBe(true);
    expect(replies).toBeGreaterThan(20);
  });

  it('fills all placeholders and uses theme phrases', () => {
    const { texts } = run('mix', 'poker', 800);
    expect(texts.every((t) => !/\{[a-z]+\}/.test(t))).toBe(true);
    expect(texts.some((t) => /баунти|bounty|баунті|ривер|рівер|river/i.test(t))).toBe(true);
  });
});

describe('ViewerEngine', () => {
  it('stays within bounds and changes smoothly', () => {
    const e = new ViewerEngine({ initial: 75_000, min: 70_000, max: 80_000, speed: 0.5, volatility: 0.5 }, mulberry32(3));
    let prev = e.getSnapshot();
    let maxJump = 0;
    let changes = 0;
    for (let i = 0; i < 3000; i++) {
      const v = e.step();
      expect(v).toBeGreaterThanOrEqual(70_000);
      expect(v).toBeLessThanOrEqual(80_000);
      maxJump = Math.max(maxJump, Math.abs(v - prev));
      if (v !== prev) changes++;
      prev = v;
    }
    expect(maxJump).toBeLessThanOrEqual(75_000 * 0.0055 + 1);
    expect(changes).toBeGreaterThan(2500);
  });

  it('ramps to a scenario target', () => {
    let t = 0;
    const e = new ViewerEngine({ initial: 1000, min: 900, max: 1100, speed: 1, volatility: 0.3 }, mulberry32(5), () => t);
    e.rampTo(50_000, 10_000);
    for (let i = 0; i <= 40; i++) {
      t = i * 500;
      e.step();
    }
    expect(Math.abs(e.getSnapshot() - 50_000)).toBeLessThan(50_000 * 0.03);
  });

  it('normalizes config and formats numbers', () => {
    expect(normalizeViewerConfig({ initial: 5, min: 2_000_000, max: 0, speed: 3, volatility: -1 })).toMatchObject({
      min: 1,
      max: 1_000_000,
      speed: 1,
      volatility: 0,
    });
    expect(formatViewers(75130)).toBe('75 130');
  });
});

describe('scenario script', () => {
  it('parses times, users, commands and errors', () => {
    const r = parseScenarioScript(`# test
0:00 !viewers 75k 10s
0:02 masha.k: привет
+3 просто текст
ещё строка
1:05 !chat hyper
!hearts 30
!oops`);
    expect(r.events.map((e) => [e.type, e.at])).toEqual([
      ['viewers', 0],
      ['comment', 2000],
      ['comment', 5000],
      ['comment', 6500],
      ['chat', 65000],
      ['hearts', 66500],
    ]);
    expect(r.events[0]).toMatchObject({ to: 75_000, durationMs: 10_000 });
    expect(r.events[1]).toMatchObject({ username: 'masha.k', text: 'привет' });
    expect(r.errors).toHaveLength(1);
    expect(parseCount('1.2m')).toBe(1_000_000);
    expect(parseCount('75 000')).toBe(75_000);
  });

  it('sanitizes stored data', () => {
    expect(sanitizeScenario({ script: 'hi', initialViewers: 1e9, speed: 9 })).toMatchObject({ initialViewers: 1_000_000, speed: 2 });
    expect(sanitizeScenario({ name: 'x' })).toBeNull();
    const s = sanitizeSettings({ viewersMin: 500, viewersMax: 100, chatMode: 'nope', streamerName: '  ' });
    expect(s.viewersMin).toBe(100);
    expect(s.viewersMax).toBe(500);
    expect(s.chatMode).toBe('active');
    expect(s.streamerName).toBe('your.name');
  });
});
