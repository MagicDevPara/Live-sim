import { useEffect, useState, useSyncExternalStore } from 'react';

interface Store<T> {
  subscribe: (l: () => void) => () => void;
  getSnapshot: () => T;
}

/** Подписка компонента на модуль ядра; перерисовывается только этот компонент. */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** Тикающее «сейчас» для таймеров; не тикает, когда выключено. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}
