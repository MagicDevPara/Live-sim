import { useState } from 'react';
import type { LiveSession } from '../core/LiveSession';
import { SettingsTab } from './SettingsTab';
import { ScenariosTab } from './ScenariosTab';
import { Segmented } from './controls';

export type SheetTab = 'settings' | 'scenarios';

/**
 * Полупрозрачная нижняя панель управления. Занимает не больше ~68% высоты —
 * верхняя часть кадра с камерой остаётся видна.
 */
export function ControlSheet({
  session,
  initialTab = 'settings',
  onClose,
}: {
  session: LiveSession;
  initialTab?: SheetTab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<SheetTab>(initialTab);
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-label="Управление эфиром">
      <button type="button" aria-label="Закрыть" className="flex-1 bg-black/10" onClick={onClose} />
      <div className="sheet-in flex max-h-[68dvh] flex-col rounded-t-[18px] bg-[#141416]/88 backdrop-blur-2xl backdrop-saturate-150">
        <div className="px-safe shrink-0 pt-2 pb-3">
          <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-white/25" />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Segmented<SheetTab>
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'settings', label: 'Эфир' },
                  { value: 'scenarios', label: 'Режим записи' },
                ]}
              />
            </div>
            <button type="button" onClick={onClose} className="h-9 px-2 text-[15px] font-semibold text-white/85 active:opacity-60">
              Готово
            </button>
          </div>
        </div>
        <div className="px-safe pb-safe no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pt-1">
          <div className="pb-4">
            {tab === 'settings' ? <SettingsTab session={session} /> : <ScenariosTab session={session} onPlayed={onClose} />}
          </div>
        </div>
      </div>
    </div>
  );
}
