import { useMemo, useRef, useState } from 'react';
import type { LiveSession } from '../core/LiveSession';
import { newId, type Scenario } from '../core/scenarios/ScenarioManager';
import { formatClock, parseScenarioScript, type ScenarioChatMode } from '../core/scenarios/scenarioScript';
import { formatViewers } from '../core/viewers/ViewerEngine';
import { useNow, useStore } from '../hooks/useStore';
import { Button, NumberField, Section, Segmented, Slider, TextInputClass } from './controls';
import { EditIcon, PauseIcon, PlayIcon, StopIcon } from './icons';

const CHAT_LABEL: Record<ScenarioChatMode, string> = { calm: 'спокойный', active: 'активный', hyper: 'очень активный', off: 'только сценарий' };

type DownloadsApi = { save: (r: { filename: string; data: string }) => Promise<unknown> };
type ClaudeHost = { use?: (name: string) => Promise<DownloadsApi | null> };

async function download(filename: string, text: string) {
  // Внутри артефакта claude.ai файл отдаётся через возможность `downloads`.
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (host?.use) {
    try {
      const dl = await host.use('downloads');
      if (dl) {
        await dl.save({ filename, data: text });
        return;
      }
    } catch {
      return; // пользователь отказался — это не ошибка
    }
  }
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Панель «Режим записи»: таймер сессии, управление сценарием, быстрые реплики, библиотека сценариев. */
export function ScenariosTab({ session, onPlayed }: { session: LiveSession; onPlayed: () => void }) {
  const list = useStore(session.scenarios);
  const player = useStore(session.player);
  const live = useStore(session);
  const now = useNow(500, live.live || player.status === 'playing');
  const [editing, setEditing] = useState<Scenario | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const current = player.scenarioId ? session.scenarios.get(player.scenarioId) : undefined;

  if (editing) {
    return (
      <ScenarioEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onDelete={
          session.scenarios.get(editing.id)
            ? () => {
                session.scenarios.remove(editing.id);
                setEditing(null);
              }
            : undefined
        }
        onSave={(s) => {
          session.scenarios.save(s);
          setEditing(null);
        }}
      />
    );
  }

  const play = (id: string) => {
    const errs = session.playScenario(id);
    setErrors(errs);
    if (!errs.length) onPlayed();
  };

  return (
    <div className="space-y-6">
      <Section title="Сессия">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[12px] bg-white/8 px-3 py-2.5">
            <div className="text-[12px] text-white/50">Эфир идёт</div>
            <div className="text-[22px] font-semibold tabular-nums">{live.live ? formatClock(now - live.startedAt) : '—'}</div>
          </div>
          <div className="rounded-[12px] bg-white/8 px-3 py-2.5">
            <div className="text-[12px] text-white/50">Сценарий</div>
            <div className="text-[22px] font-semibold tabular-nums">
              {player.status === 'idle' ? '—' : `${formatClock(session.player.elapsed())}`}
              {player.status !== 'idle' && (
                <span className="text-[13px] font-normal text-white/45"> / {formatClock(player.durationMs)}</span>
              )}
            </div>
          </div>
        </div>
        {player.status !== 'idle' && (
          <div className="rounded-[12px] bg-white/8 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{current?.name ?? 'Сценарий'}</div>
                <div className="text-[12px] text-white/50">
                  {player.status === 'finished' ? 'Завершён' : player.status === 'paused' ? 'На паузе' : 'Воспроизводится'} · событие{' '}
                  {Math.min(player.index, player.total)}/{player.total}
                </div>
              </div>
              <div className="flex gap-1.5">
                {player.status === 'playing' && (
                  <Button onClick={() => session.player.pause()}>
                    <PauseIcon size={18} />
                  </Button>
                )}
                {player.status === 'paused' && (
                  <Button onClick={() => session.player.resume()}>
                    <PlayIcon size={18} />
                  </Button>
                )}
                <Button onClick={() => session.player.stop()}>
                  <StopIcon size={18} />
                </Button>
              </div>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${player.total ? (Math.min(player.index, player.total) / player.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
        {errors.length > 0 && (
          <div className="rounded-[12px] bg-[#ff453a]/15 p-3 text-[13px] text-[#ffb4ae]">
            {errors.slice(0, 4).map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}
      </Section>

      <QuickLine session={session} />

      <Section title="Сценарии">
        <div className="space-y-2">
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-[12px] bg-white/8 p-2.5 pl-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{s.name}</div>
                <div className="truncate text-[12px] text-white/50">
                  {formatViewers(s.initialViewers)} зрителей · чат {CHAT_LABEL[s.chatMode]} · {s.speed}×
                </div>
              </div>
              <button
                type="button"
                aria-label="Редактировать"
                onClick={() => setEditing({ ...s })}
                className="grid h-10 w-10 place-items-center rounded-[10px] text-white/80 active:bg-white/10"
              >
                <EditIcon size={19} />
              </button>
              <button
                type="button"
                aria-label="Запустить"
                onClick={() => play(s.id)}
                className="grid h-10 w-10 place-items-center rounded-[10px] bg-white text-black active:opacity-70"
              >
                <PlayIcon size={18} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() =>
              setEditing({
                id: newId(),
                name: 'Новый сценарий',
                initialViewers: session.settings.getSnapshot().viewersInitial,
                chatMode: 'active',
                speed: 1,
                script: '0:00 !viewers 1200\n0:02 masha.k: привет!\n+3 круто 🔥\n0:10 !hearts 20',
                updatedAt: Date.now(),
              })
            }
          >
            Создать
          </Button>
          <Button onClick={() => importRef.current?.click()}>Загрузить файл</Button>
          <Button onClick={() => void download('live-scenarios.json', session.scenarios.exportJson())}>Сохранить в файл</Button>
          <Button variant="ghost" onClick={() => session.scenarios.restoreDefaults()}>
            Примеры
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                const n = session.scenarios.importJson(await f.text());
                setNotice(`Загружено сценариев: ${n}`);
              } catch (err) {
                setNotice((err as Error).message);
              }
            }}
          />
        </div>
        {notice && <div className="text-[13px] text-white/60">{notice}</div>}
      </Section>
    </div>
  );
}

function QuickLine({ session }: { session: LiveSession }) {
  const [user, setUser] = useState('');
  const [text, setText] = useState('');
  return (
    <Section title="Реплика в чат">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          session.sendScripted(user, text);
          setText('');
        }}
      >
        <input
          className={TextInputClass}
          placeholder="ник (пусто — случайный)"
          value={user}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setUser(e.target.value)}
        />
        <div className="flex gap-2">
          <input className={TextInputClass} placeholder="текст комментария" value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="submit" variant="primary" disabled={!text.trim()}>
            Отправить
          </Button>
        </div>
      </form>
    </Section>
  );
}

const HELP = `0:05 masha.k: привет — сообщение в 0:05
+2 круто! — через 2 с, случайный зритель
!viewers 75k 15s — счётчик до 75 000 за 15 с
!chat calm | active | hyper | off
!hearts 30 — всплеск сердечек
# комментарий`;

function ScenarioEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Scenario;
  onSave: (s: Scenario) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [s, setS] = useState(initial);
  const parsed = useMemo(() => parseScenarioScript(s.script), [s.script]);
  const up = (p: Partial<Scenario>) => setS((x) => ({ ...x, ...p }));

  return (
    <div className="space-y-5">
      <Section title="Сценарий">
        <input className={TextInputClass} value={s.name} maxLength={60} onChange={(e) => up({ name: e.target.value })} aria-label="Название" />
        <NumberField label="Зрителей в начале" value={s.initialViewers} onCommit={(n) => up({ initialViewers: n })} />
        <div>
          <div className="mb-1 text-[12px] text-white/55">Случайный чат во время сценария</div>
          <Segmented<ScenarioChatMode>
            value={s.chatMode}
            onChange={(v) => up({ chatMode: v })}
            options={[
              { value: 'off', label: 'Выкл' },
              { value: 'calm', label: 'Спок.' },
              { value: 'active', label: 'Актив.' },
              { value: 'hyper', label: 'Очень' },
            ]}
          />
        </div>
        <Slider label={`Скорость воспроизведения: ${s.speed}×`} left="0.5×" right="2×" min={0.5} max={2} step={0.25} value={s.speed} onChange={(v) => up({ speed: v })} />
      </Section>
      <Section title="Таймлайн">
        <textarea
          value={s.script}
          onChange={(e) => up({ script: e.target.value })}
          spellCheck={false}
          autoCapitalize="none"
          rows={12}
          className="w-full rounded-[10px] bg-white/10 p-3 font-mono text-[14px] leading-relaxed outline-none focus:bg-white/15"
        />
        <div className="text-[12px] text-white/50">
          Событий: {parsed.events.length} · длительность {formatClock(parsed.durationMs / s.speed)}
        </div>
        {parsed.errors.length > 0 && (
          <div className="rounded-[10px] bg-[#ff453a]/15 p-2.5 text-[12px] text-[#ffb4ae]">
            {parsed.errors.slice(0, 5).map((e) => (
              <div key={e.line}>
                Строка {e.line}: {e.message}
              </div>
            ))}
          </div>
        )}
        <pre className="rounded-[10px] bg-white/5 p-2.5 text-[11.5px] leading-relaxed whitespace-pre-wrap text-white/55">{HELP}</pre>
      </Section>
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={() => onSave(s)} disabled={!parsed.events.length}>
          Сохранить
        </Button>
        <Button onClick={onCancel}>Отмена</Button>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          className="w-full text-[#ff6961]"
          onClick={() => {
            if (confirm('Удалить сценарий?')) onDelete();
          }}
        >
          Удалить сценарий
        </Button>
      )}
    </div>
  );
}
