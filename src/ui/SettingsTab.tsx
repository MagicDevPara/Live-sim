import { useRef } from 'react';
import type { LiveSession } from '../core/LiveSession';
import type { ChatMode, Lang, Theme } from '../core/types';
import { VIEWER_PRESETS, resizeImageToDataUrl } from '../core/settings/SettingsManager';
import { useStore } from '../hooks/useStore';
import { Avatar } from './Avatar';
import { Button, NumberField, Row, Section, Segmented, Slider, TextInputClass, Toggle } from './controls';
import { FlipIcon } from './icons';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'general', label: 'Общая' },
  { value: 'poker', label: 'Покер' },
  { value: 'gaming', label: 'Игры' },
  { value: 'music', label: 'Музыка' },
  { value: 'irl', label: 'Улица' },
];

export function SettingsTab({ session }: { session: LiveSession }) {
  const s = useStore(session.settings);
  const up = session.settings.update.bind(session.settings);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <Section title="Стример">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Сменить аватар">
            <Avatar profile={session.streamerProfile()} size={52} ring />
          </button>
          <input
            className={TextInputClass}
            value={s.streamerName}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => up({ streamerName: e.target.value.replace(/\s+/g, '_') })}
            aria-label="Никнейм"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fileRef.current?.click()}>Загрузить фото</Button>
          {s.streamerAvatar && (
            <Button variant="ghost" onClick={() => up({ streamerAvatar: null })}>
              Убрать фото
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                up({ streamerAvatar: await resizeImageToDataUrl(f) });
              } catch {
                /* неподдерживаемый формат — игнорируем */
              }
            }}
          />
        </div>
      </Section>

      <Section title="Зрители">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {VIEWER_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() =>
                up({
                  viewersInitial: p.initial,
                  viewersMin: Math.max(1, Math.round(p.initial * (1 - p.spread))),
                  viewersMax: Math.min(1_000_000, Math.round(p.initial * (1 + p.spread))),
                })
              }
              className="h-8 shrink-0 rounded-full bg-white/10 px-3 text-[13px] font-medium active:bg-white/20"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Старт" value={s.viewersInitial} onCommit={(n) => up({ viewersInitial: n })} />
          <NumberField label="Минимум" value={s.viewersMin} onCommit={(n) => up({ viewersMin: n })} />
          <NumberField label="Максимум" value={s.viewersMax} onCommit={(n) => up({ viewersMax: n })} />
        </div>
        <Slider label="Скорость изменения" left="медленно" right="быстро" value={s.viewerSpeed} onChange={(v) => up({ viewerSpeed: v })} />
        <Slider
          label="Интенсивность колебаний"
          left="ровно"
          right="сильно"
          value={s.viewerVolatility}
          onChange={(v) => up({ viewerVolatility: v })}
        />
      </Section>

      <Section title="Чат">
        <Segmented<ChatMode>
          value={s.chatMode}
          onChange={(v) => up({ chatMode: v })}
          options={[
            { value: 'calm', label: 'Спокойный' },
            { value: 'active', label: 'Активный' },
            { value: 'hyper', label: 'Очень активный' },
          ]}
        />
        <Segmented<Lang>
          value={s.lang}
          onChange={(v) => up({ lang: v })}
          options={[
            { value: 'ru', label: 'RU' },
            { value: 'uk', label: 'UA' },
            { value: 'en', label: 'EN' },
            { value: 'mix', label: 'Микс' },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => up({ theme: t.value })}
              className={`h-8 rounded-full px-3 text-[13px] font-medium ${s.theme === t.value ? 'bg-white text-black' : 'bg-white/10'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Row label="Пауза комментариев" hint="Случайные комментарии не появляются">
          <Toggle label="Пауза комментариев" checked={s.paused} onChange={(v) => up({ paused: v })} />
        </Row>
        <Row label="Входы зрителей" hint="«… присоединился(-ась)»">
          <Toggle label="Входы зрителей" checked={s.showJoins} onChange={(v) => up({ showJoins: v })} />
        </Row>
        <Row label="Сердечки">
          <Toggle label="Сердечки" checked={s.hearts} onChange={(v) => up({ hearts: v })} />
        </Row>
      </Section>

      <Section title="Камера">
        <Button onClick={() => session.switchCamera()} className="w-full">
          <FlipIcon size={18} /> {s.facing === 'user' ? 'Переключить на основную' : 'Переключить на фронтальную'}
        </Button>
      </Section>

      <Section title="Сброс">
        <Button
          variant="ghost"
          className="w-full text-[#ff6961]"
          onClick={() => {
            if (confirm('Сбросить все настройки к значениям по умолчанию?')) session.settings.reset();
          }}
        >
          Сбросить настройки
        </Button>
      </Section>
    </div>
  );
}
