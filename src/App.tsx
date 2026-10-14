import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveSession } from './core/LiveSession';
import { useStore } from './hooks/useStore';
import { CameraView } from './ui/CameraView';
import { TopBar } from './ui/TopBar';
import { ChatOverlay } from './ui/ChatOverlay';
import { BottomBar } from './ui/BottomBar';
import { ReactionLayer } from './ui/ReactionLayer';
import { StartScreen } from './ui/StartScreen';
import { CameraNotice, ConfirmEnd } from './ui/CameraNotice';
import { ControlSheet, type SheetTab } from './ui/ControlSheet';

// Один экземпляр на всё приложение: движки живут вне React и не пересоздаются при рендерах.
const session = new LiveSession();

export default function App() {
  const settings = useStore(session.settings);
  const camera = useStore(session.camera);
  const { live } = useStore(session);
  const [sheet, setSheet] = useState<SheetTab | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const lastTap = useRef(0);

  const streamer = session.streamerProfile();

  const sendOwn = useCallback((t: string) => session.sendOwn(t), []);
  const heart = useCallback(() => session.reactions.burst(3), []);
  const openControls = useCallback(() => setSheet('settings'), []);
  const askEnd = useCallback(() => setConfirmEnd(true), []);
  const openScenarios = useCallback(() => setSheet('scenarios'), []);

  // Блокируем «резиновую» прокрутку страницы в Safari, кроме прокручиваемых панелей.
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('.overflow-y-auto, .overflow-x-auto, textarea')) return;
      e.preventDefault();
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  // Двойной тап по видео — сердечки, как в стриминговых приложениях.
  const onStageTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) session.reactions.burst(5);
    lastTap.current = now;
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <CameraView stream={camera.stream} mirrored={camera.facing === 'user'} />

      {live && (
        <>
          <div className="absolute inset-0" onClick={onStageTap} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50dvh] bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

          <CameraNotice state={camera} onRetry={() => void session.camera.restart()} />

          <TopBar streamer={streamer} viewers={session.viewers} onClose={askEnd} onAvatarTap={openScenarios} />
          <ReactionLayer engine={session.reactions} />

          <div className="pb-safe px-safe absolute inset-x-0 bottom-0 z-20">
            <ChatOverlay engine={session.comments} />
            <div className="mt-3">
              <BottomBar onSend={sendOwn} onHeart={heart} onMore={openControls} />
            </div>
          </div>
        </>
      )}

      {!live && (
        <StartScreen settings={settings} streamer={streamer} onStart={() => session.start()} onOpenControls={openControls} />
      )}

      {sheet && <ControlSheet session={session} initialTab={sheet} onClose={() => setSheet(null)} />}

      {confirmEnd && (
        <ConfirmEnd
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => {
            setConfirmEnd(false);
            setSheet(null);
            session.end();
          }}
        />
      )}
    </div>
  );
}
