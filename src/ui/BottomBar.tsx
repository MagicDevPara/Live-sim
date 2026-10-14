import { memo, useRef, useState, type FormEvent } from 'react';
import { HeartIcon, MoreIcon, QuestionIcon, SendIcon } from './icons';

interface Props {
  onSend: (text: string) => void;
  onHeart: () => void;
  onMore: () => void;
}

export const BottomBar = memo(function BottomBar({ onSend, onHeart, onMore }: Props) {
  const [text, setText] = useState('');
  const [pop, setPop] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
    inputRef.current?.blur();
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        enterKeyHint="send"
        maxLength={200}
        placeholder="Комментарий…"
        aria-label="Комментарий"
        className="h-[44px] min-w-0 flex-1 rounded-full border border-white/45 bg-black/10 px-4 text-[16px] text-white outline-none placeholder:text-white/85 focus:border-white/70"
      />
      <button type="button" onClick={onMore} aria-label="Управление" className="grid h-11 w-10 place-items-center active:opacity-60">
        <MoreIcon size={24} />
      </button>
      <button type="button" aria-label="Вопросы" className="tshadow grid h-11 w-10 place-items-center active:opacity-60 max-[370px]:hidden">
        <QuestionIcon size={25} strokeWidth={1.8} />
      </button>
      <button
        type={text.trim() ? 'submit' : 'button'}
        aria-label="Отправить"
        className="tshadow grid h-11 w-10 place-items-center active:opacity-60"
      >
        <SendIcon size={24} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Нравится"
        onClick={() => {
          onHeart();
          setPop((p) => p + 1);
        }}
        className="tshadow grid h-11 w-10 place-items-center"
      >
        <HeartIcon key={pop} size={27} strokeWidth={1.8} className={pop ? 'heart-pop' : undefined} />
      </button>
    </form>
  );
});
