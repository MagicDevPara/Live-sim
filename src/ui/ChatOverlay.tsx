import { memo, useLayoutEffect, useRef } from 'react';
import type { ChatMessage } from '../core/types';
import type { CommentEngine } from '../core/comments/CommentEngine';
import { JOIN_TEXT } from '../core/data/phrases';
import { useStore } from '../hooks/useStore';
import { Avatar } from './Avatar';

const GAP = 10;

const MessageRow = memo(function MessageRow({ m }: { m: ChatMessage }) {
  if (m.kind === 'join') {
    return (
      <div className="msg-in flex items-center gap-2 py-[1px]">
        <Avatar profile={m.profile} size={24} />
        <div className="tshadow text-[13px] leading-snug">
          <span className="font-semibold">{m.profile.username}</span>{' '}
          <span className="text-white/85">{JOIN_TEXT[m.profile.lang]}</span>
        </div>
      </div>
    );
  }
  const mention = m.text.match(/^(@\S+)\s(.*)$/s);
  return (
    <div className="msg-in flex items-start gap-2.5">
      <Avatar profile={m.profile} size={32} />
      <div className="tshadow min-w-0 pt-[1px] leading-[1.25]">
        <div className="text-[13px] font-semibold">{m.profile.username}</div>
        <div className="text-[14px] break-words text-white">
          {mention ? (
            <>
              <span className="font-semibold">{mention[1]}</span> {mention[2]}
            </>
          ) : (
            m.text
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Список комментариев. Новые появляются снизу, весь список плавно «подъезжает» (FLIP),
 * старые растворяются в маске сверху и удаляются из DOM движком.
 */
export const ChatOverlay = memo(function ChatOverlay({ engine }: { engine: CommentEngine }) {
  const messages = useStore(engine);
  const listRef = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = listRef.current;
    const last = messages[messages.length - 1];
    if (!el || !last || last.id === lastId.current) return;
    lastId.current = last.id;
    const node = el.lastElementChild as HTMLElement | null;
    if (!node) return;
    const shift = node.offsetHeight + GAP;
    el.style.transition = 'none';
    el.style.transform = `translate3d(0, ${shift}px, 0)`;
    void el.offsetHeight; // принудительный reflow перед анимацией
    el.style.transition = 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    el.style.transform = 'translate3d(0, 0, 0)';
  }, [messages]);

  return (
    <div className="chat-mask pointer-events-none relative flex h-[min(40dvh,330px)] w-[min(78vw,340px)] flex-col justify-end overflow-hidden">
      <div ref={listRef} className="chat-list flex flex-col" style={{ gap: GAP }}>
        {messages.map((m) => (
          <MessageRow key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
});
