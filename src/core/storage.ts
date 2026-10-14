/** Безопасная обёртка над localStorage: в приватном режиме Safari он может бросать исключения. */
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Простое наблюдаемое хранилище для useSyncExternalStore. */
export class Emitter {
  private listeners = new Set<() => void>();
  subscribe = (l: () => void): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  protected emit(): void {
    this.listeners.forEach((l) => l());
  }
}
