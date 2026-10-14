import { Emitter, readJson, writeJson } from '../storage';
import { clamp } from '../rng';
import type { ScenarioChatMode } from './scenarioScript';
import { DEFAULT_SCENARIOS } from './defaults';

export interface Scenario {
  id: string;
  name: string;
  /** Количество зрителей в момент запуска. */
  initialViewers: number;
  /** Активность случайного чата во время сценария (off — только реплики сценария). */
  chatMode: ScenarioChatMode;
  /** Скорость воспроизведения 0.5–2×. */
  speed: number;
  script: string;
  updatedAt: number;
}

const KEY = 'livesim.scenarios.v1';
const FILE_FORMAT = 'live-simulator-scenarios';

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function sanitizeScenario(raw: unknown): Scenario | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.script !== 'string') return null;
  const modes: ScenarioChatMode[] = ['calm', 'active', 'hyper', 'off'];
  const iv = typeof r.initialViewers === 'number' && Number.isFinite(r.initialViewers) ? r.initialViewers : 1200;
  return {
    id: typeof r.id === 'string' && r.id ? r.id : newId(),
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 60) : 'Без названия',
    initialViewers: Math.round(clamp(iv, 1, 1_000_000)),
    chatMode: modes.includes(r.chatMode as ScenarioChatMode) ? (r.chatMode as ScenarioChatMode) : 'active',
    speed: clamp(typeof r.speed === 'number' && Number.isFinite(r.speed) ? r.speed : 1, 0.5, 2),
    script: r.script.slice(0, 50_000),
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : Date.now(),
  };
}

/** Хранит сценарии локально, умеет импорт/экспорт в JSON-файл. */
export class ScenarioManager extends Emitter {
  private list: Scenario[];

  constructor() {
    super();
    const stored = readJson<unknown[]>(KEY);
    const parsed = Array.isArray(stored) ? stored.map(sanitizeScenario).filter((s): s is Scenario => !!s) : null;
    this.list = parsed && parsed.length ? parsed : DEFAULT_SCENARIOS.map((s) => ({ ...s }));
  }

  getSnapshot = (): Scenario[] => this.list;

  get(id: string): Scenario | undefined {
    return this.list.find((s) => s.id === id);
  }

  save(s: Scenario): void {
    const clean = sanitizeScenario({ ...s, updatedAt: Date.now() });
    if (!clean) return;
    const i = this.list.findIndex((x) => x.id === clean.id);
    this.list = i >= 0 ? this.list.map((x, j) => (j === i ? clean : x)) : [clean, ...this.list];
    this.persist();
  }

  remove(id: string): void {
    this.list = this.list.filter((s) => s.id !== id);
    this.persist();
  }

  duplicate(id: string): Scenario | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    const copy = { ...src, id: newId(), name: `${src.name} (копия)`, updatedAt: Date.now() };
    this.list = [copy, ...this.list];
    this.persist();
    return copy;
  }

  restoreDefaults(): void {
    const ids = new Set(this.list.map((s) => s.id));
    this.list = [...this.list, ...DEFAULT_SCENARIOS.filter((d) => !ids.has(d.id)).map((d) => ({ ...d }))];
    this.persist();
  }

  exportJson(ids?: string[]): string {
    const items = ids ? this.list.filter((s) => ids.includes(s.id)) : this.list;
    return JSON.stringify({ format: FILE_FORMAT, version: 1, scenarios: items }, null, 2);
  }

  /** Импортирует сценарии из JSON; одинаковые id перезаписываются. Возвращает число импортированных. */
  importJson(text: string): number {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Файл не является корректным JSON');
    }
    const arr = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as { scenarios?: unknown }).scenarios)
        ? (data as { scenarios: unknown[] }).scenarios
        : [data];
    const items = arr.map(sanitizeScenario).filter((s): s is Scenario => !!s);
    if (!items.length) throw new Error('В файле не найдено сценариев');
    for (const it of items) {
      const i = this.list.findIndex((x) => x.id === it.id);
      if (i >= 0) this.list = this.list.map((x, j) => (j === i ? it : x));
      else this.list = [it, ...this.list];
    }
    this.persist();
    return items.length;
  }

  private persist(): void {
    writeJson(KEY, this.list);
    this.emit();
  }
}
