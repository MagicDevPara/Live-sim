import type { BaseLang, Profile } from '../types';
import { AVATAR_GLYPHS, FIRST_NAMES, LAST_NAMES, NICK_WORDS } from '../data/names';
import { chance, hashString, mulberry32, pick, randInt, type Rng } from '../rng';

const LANGS: BaseLang[] = ['ru', 'uk', 'en'];

/** Шаблоны ников: точки, подчёркивания, цифры, годы — как у реальных аккаунтов. */
const PATTERNS: ((f: string, l: string, r: Rng) => string)[] = [
  (f, l) => `${f}.${l}`,
  (f, l) => `${f}_${l}`,
  (f, _l, r) => `${f}${randInt(85, 99, r)}`,
  (f, _l, r) => `${f}${randInt(2000, 2009, r)}`,
  (f, _l, r) => `${f}_${randInt(1, 999, r)}`,
  (f, l) => `${f}${l[0]}`,
  (f) => `_${f}_`,
  (f, _l, r) => `${f}.${pick(NICK_WORDS, r)}`,
  (f, _l, r) => `${pick(NICK_WORDS, r)}.${f}`,
  (f, _l, r) => `${f}__${pick(NICK_WORDS, r)}`,
  (f, l) => `${l}.${f}`,
  (f, _l, r) => `its.${f}${chance(0.5, r) ? randInt(1, 99, r) : ''}`,
  (f, _l, r) => `${f}${f[f.length - 1].repeat(randInt(2, 3, r))}`,
  (_f, _l, r) => `${pick(NICK_WORDS, r)}_${pick(NICK_WORDS, r)}${chance(0.4, r) ? randInt(1, 99, r) : ''}`,
  (f, l, r) => `${f[0]}.${l}${chance(0.5, r) ? `_${randInt(1, 99, r)}` : ''}`,
  (f, _l, r) => `x${f}x${chance(0.3, r) ? randInt(1, 9, r) : ''}`,
  (f, l) => `${f}.${l}.official`,
  (f, _l, r) => `${f}_${pick(['ua', 'kyiv', 'lviv', 'odesa', 'life', 'daily', 'pm', 'xx'], r)}`,
];

function initialsOf(username: string): string {
  const letters = username.replace(/[^a-zA-Z]/g, '');
  return (letters[0] ?? '?').toUpperCase();
}

/** Профиль для произвольного ника (сценарии, ручные реплики). */
export function profileFromUsername(username: string, lang: BaseLang = 'ru'): Profile {
  const h = hashString(username);
  return {
    id: `u_${h.toString(36)}`,
    username,
    lang,
    hue: h % 360,
    initials: initialsOf(username),
    style: h % 5,
    glyph: h % 5 === 4 ? AVATAR_GLYPHS[h % AVATAR_GLYPHS.length] : undefined,
  };
}

export function generateProfiles(count = 1200, seed = 20261014): Profile[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  const out: Profile[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    const lang = LANGS[out.length % 3];
    const first = pick(FIRST_NAMES[lang], rng);
    const last = pick(LAST_NAMES[lang], rng);
    let name = pick(PATTERNS, rng)(first, last, rng).toLowerCase();
    if (name.length > 26) name = name.slice(0, 26).replace(/[._]+$/, '');
    if (seen.has(name)) continue;
    seen.add(name);
    const style = randInt(0, 4, rng);
    out.push({
      id: `p${out.length}`,
      username: name,
      lang,
      hue: randInt(0, 359, rng),
      initials: initialsOf(name),
      style,
      glyph: style === 4 ? pick(AVATAR_GLYPHS, rng) : undefined,
    });
  }
  return out;
}

let cached: Profile[] | null = null;
export function getProfiles(): Profile[] {
  if (!cached) cached = generateProfiles();
  return cached;
}
