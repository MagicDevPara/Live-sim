import { memo } from 'react';
import type { ViewerEngine } from '../core/viewers/ViewerEngine';
import { formatViewers } from '../core/viewers/ViewerEngine';
import type { Profile } from '../core/types';
import { useStore } from '../hooks/useStore';
import { Avatar } from './Avatar';
import { CloseIcon, EyeIcon } from './icons';

/** Отдельный компонент, чтобы обновление числа перерисовывало только его. */
const ViewerCount = memo(function ViewerCount({ engine }: { engine: ViewerEngine }) {
  const n = useStore(engine);
  return (
    <div className="flex h-[26px] items-center gap-1 rounded-[6px] bg-black/35 px-2 text-[13px] font-semibold tabular-nums backdrop-blur-sm">
      <EyeIcon size={15} strokeWidth={2.2} />
      <span>{formatViewers(n)}</span>
    </div>
  );
});

interface Props {
  streamer: Profile;
  viewers: ViewerEngine;
  onClose: () => void;
  onAvatarTap?: () => void;
}

export const TopBar = memo(function TopBar({ streamer, viewers, onClose, onAvatarTap }: Props) {
  return (
    <div className="pt-safe px-safe pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="pointer-events-auto flex items-start justify-between pt-1.5">
        <button type="button" onClick={onAvatarTap} className="flex min-w-0 items-center gap-2 text-left">
          <Avatar profile={streamer} size={34} ring />
          <div className="min-w-0">
            <div className="tshadow max-w-[42vw] truncate text-[14px] font-semibold leading-tight">{streamer.username}</div>
            {/* Обязательная маркировка постановочного режима. Не отключается в настройках. */}
            <div className="mt-[2px] text-[8.5px] font-semibold uppercase leading-none tracking-[0.22em] text-white/55">
              Simulation
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1.5">
          <div className="flex h-[26px] items-center rounded-[6px] bg-gradient-to-r from-[#ff2d55] to-[#ff4f7b] px-2 text-[12.5px] font-bold tracking-[0.04em]">
            LIVE
          </div>
          <ViewerCount engine={viewers} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Завершить эфир"
            className="tshadow -mr-1 grid h-9 w-9 place-items-center active:opacity-60"
          >
            <CloseIcon size={26} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
});
