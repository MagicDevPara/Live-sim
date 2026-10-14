import type { CameraState } from '../core/camera/CameraManager';

export function CameraNotice({ state, onRetry }: { state: CameraState; onRetry: () => void }) {
  if (state.status === 'live' || state.status === 'idle') return null;
  if (state.status === 'starting') {
    return (
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
      </div>
    );
  }
  return (
    <div className="absolute inset-x-6 top-[30%] z-10 rounded-2xl bg-black/60 p-4 text-center backdrop-blur-md fade-in">
      <div className="text-[15px] font-semibold">Камера недоступна</div>
      <p className="mt-1.5 text-[13px] leading-snug text-white/70">{state.error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 h-9 rounded-full bg-white px-5 text-[14px] font-semibold text-black active:opacity-70"
      >
        Повторить
      </button>
    </div>
  );
}

export function ConfirmEnd({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fade-in absolute inset-0 z-50 grid place-items-center bg-black/45 p-8" onClick={onCancel}>
      <div className="w-full max-w-[290px] overflow-hidden rounded-[14px] bg-[#262628]/95 text-center backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-3">
          <div className="text-[16px] font-semibold">Завершить эфир?</div>
          <div className="mt-1 text-[13px] text-white/60">Симуляция остановится, камера выключится.</div>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10 text-[16px]">
          <button type="button" onClick={onCancel} className="h-11 border-r border-white/10 active:bg-white/5">
            Отмена
          </button>
          <button type="button" onClick={onConfirm} className="h-11 font-semibold text-[#ff453a] active:bg-white/5">
            Завершить
          </button>
        </div>
      </div>
    </div>
  );
}
