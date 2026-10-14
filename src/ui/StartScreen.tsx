import type { Settings } from '../core/types';
import { Avatar } from './Avatar';
import type { Profile } from '../core/types';

interface Props {
  settings: Settings;
  streamer: Profile;
  onStart: () => void;
  onOpenControls: () => void;
}

export function StartScreen({ settings, streamer, onStart, onOpenControls }: Props) {
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;
  return (
    <div className="pt-safe pb-safe px-safe fade-in absolute inset-0 z-30 flex flex-col bg-[radial-gradient(120%_80%_at_50%_0%,#2a1622_0%,#0b0b0d_55%,#000_100%)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Avatar profile={streamer} size={92} ring />
        <div>
          <div className="text-[20px] font-semibold">{settings.streamerName}</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Live Simulator</div>
        </div>
        <p className="max-w-[300px] text-[14px] leading-relaxed text-white/60">
          Постановочный эфир для съёмки контента. Камера остаётся на устройстве, зрители и комментарии генерируются
          локально.
        </p>
        {insecure && (
          <p className="max-w-[300px] rounded-xl bg-[#ff9f0a]/15 px-3 py-2 text-[13px] text-[#ffcc80]">
            Страница открыта не по HTTPS — Safari не даст доступ к камере.
          </p>
        )}
      </div>
      <div className="space-y-2 pb-2">
        <button
          type="button"
          onClick={onStart}
          className="h-[52px] w-full rounded-[14px] bg-gradient-to-r from-[#ff2d55] to-[#ff5e3a] text-[17px] font-semibold active:opacity-80"
        >
          Начать эфир
        </button>
        <button type="button" onClick={onOpenControls} className="h-11 w-full rounded-[14px] text-[15px] text-white/75 active:bg-white/5">
          Настройки и сценарии
        </button>
      </div>
    </div>
  );
}
