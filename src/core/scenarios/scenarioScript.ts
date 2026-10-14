import type { ChatMode } from '../types';

export type ScenarioChatMode = ChatMode | 'off';

export type ScenarioEvent = { at: number; line: number } & (
  | { type: 'comment'; username?: string; text: string }
  | { type: 'viewers'; to: number; durationMs: number }
  | { type: 'chat'; mode: ScenarioChatMode }
  | { type: 'hearts'; count: number }
);

export interface ParseResult {
  events: ScenarioEvent[];
  errors: { line: number; message: string }[];
  /** Длительность до последнего события, мс. */
  durationMs: number;
}

const DEFAULT_GAP_MS = 1500;
const TIME_ABS = /^(\d{1,3}):(\d{2}(?:\.\d+)?)\s+/;
const TIME_REL = /^\+(\d+(?:[.,]\d+)?)s?\s+/;
const USER = /^@?([A-Za-z0-9._]{2,30}):\s*(.+)$/;

export function parseCount(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s| /g, '').replace(',', '.');
  const m = s.match(/^(\d+(?:\.\d+)?)(k|к|тыс|m|м|млн)?$/);
  if (!m) return null;
  const mult = !m[2] ? 1 : /^(k|к|тыс)$/.test(m[2]) ? 1_000 : 1_000_000;
  const n = Math.round(parseFloat(m[1]) * mult);
  return n >= 1 ? Math.min(n, 1_000_000) : null;
}

function parseSeconds(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d+(?:[.,]\d+)?)\s*(s|с|сек)?$/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

/**
 * Формат сценария (одна строка — одно событие):
 *   0:05 masha.k: привет всем        — сообщение от конкретного ника в момент 0:05
 *   +2 круто!                         — через 2 с после предыдущего, от случайного зрителя
 *   просто текст                      — через 1,5 с после предыдущего
 *   0:20 !viewers 75k 15s             — плавно изменить счётчик до 75 000 за 15 с
 *   !chat calm|active|hyper|off       — активность случайного чата
 *   !hearts 30                        — всплеск сердечек
 *   # комментарий                     — игнорируется
 */
export function parseScenarioScript(source: string): ParseResult {
  const events: ScenarioEvent[] = [];
  const errors: ParseResult['errors'] = [];
  let cursor = 0;

  source.split(/\r?\n/).forEach((rawLine, i) => {
    const line = i + 1;
    let s = rawLine.trim();
    if (!s || s.startsWith('#') || s.startsWith('//')) return;

    let at: number;
    const abs = s.match(TIME_ABS);
    const rel = abs ? null : s.match(TIME_REL);
    if (abs) {
      at = (parseInt(abs[1], 10) * 60 + parseFloat(abs[2])) * 1000;
      s = s.slice(abs[0].length);
    } else if (rel) {
      at = cursor + parseFloat(rel[1].replace(',', '.')) * 1000;
      s = s.slice(rel[0].length);
    } else {
      at = cursor + (events.length === 0 ? 0 : DEFAULT_GAP_MS);
    }
    at = Math.round(at);
    s = s.trim();
    if (!s) {
      errors.push({ line, message: 'Пустое событие после времени' });
      return;
    }

    if (s.startsWith('!')) {
      const [cmd, ...args] = s.slice(1).split(/\s+/);
      switch (cmd.toLowerCase()) {
        case 'viewers':
        case 'зрители': {
          const to = parseCount(args[0] ?? '');
          const dur = parseSeconds(args[1]) ?? 8;
          if (to === null) errors.push({ line, message: 'Ожидалось число зрителей, например: !viewers 75k 10s' });
          else events.push({ type: 'viewers', to, durationMs: dur * 1000, at, line });
          break;
        }
        case 'chat':
        case 'чат': {
          const map: Record<string, ScenarioChatMode> = {
            calm: 'calm', active: 'active', hyper: 'hyper', off: 'off',
            спокойный: 'calm', активный: 'active', очень: 'hyper', выкл: 'off',
          };
          const mode = map[(args[0] ?? '').toLowerCase()];
          if (!mode) errors.push({ line, message: 'Режим чата: calm, active, hyper или off' });
          else events.push({ type: 'chat', mode, at, line });
          break;
        }
        case 'hearts':
        case 'сердечки': {
          const n = parseInt(args[0] ?? '20', 10);
          events.push({ type: 'hearts', count: Number.isFinite(n) ? Math.min(Math.max(n, 1), 80) : 20, at, line });
          break;
        }
        default:
          errors.push({ line, message: `Неизвестная команда !${cmd}` });
          return;
      }
    } else {
      const u = s.match(USER);
      if (u) events.push({ type: 'comment', username: u[1], text: u[2].trim(), at, line });
      else events.push({ type: 'comment', text: s, at, line });
    }
    cursor = at;
  });

  events.sort((a, b) => a.at - b.at || a.line - b.line);
  return { events, errors, durationMs: events.length ? events[events.length - 1].at : 0 };
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`;
}
