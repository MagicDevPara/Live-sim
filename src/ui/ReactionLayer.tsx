import { memo, useEffect, useRef } from 'react';
import type { ReactionEngine } from '../core/reactions/ReactionEngine';

/** Контейнер для сердечек; сами сердечки рисует ReactionEngine напрямую в DOM. */
export const ReactionLayer = memo(function ReactionLayer({ engine }: { engine: ReactionEngine }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    engine.attach(ref.current);
    return () => engine.attach(null);
  }, [engine]);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute right-[max(var(--sar),6px)] z-10 h-[52dvh] w-[84px]"
      style={{ bottom: 'calc(max(var(--sab), 10px) + 52px)' }}
    />
  );
});
