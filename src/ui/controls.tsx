import { useEffect, useState, type ReactNode } from 'react';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">{title}</h3>
      {children}
    </section>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[15px]">{label}</div>
        {hint && <div className="text-[12px] text-white/50">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[50px] rounded-full transition-colors duration-200 ${checked ? 'bg-[#34c759]' : 'bg-white/20'}`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[26px] w-[26px] rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[20px]' : ''}`}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-[10px] bg-white/10 p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-8 flex-1 rounded-[8px] px-2 text-[13px] font-medium transition-colors ${
            value === o.value ? 'bg-white text-black' : 'text-white/80 active:bg-white/10'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Числовое поле: свободный ввод, применение по blur/Enter. */
export function NumberField({
  value,
  onCommit,
  min = 1,
  max = 1_000_000,
  label,
}: {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = parseInt(draft.replace(/\D/g, ''), 10);
    if (Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, n)));
    else setDraft(String(value));
  };
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-white/55">{label}</span>
      <input
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
        className="h-10 w-full rounded-[10px] bg-white/10 px-3 text-[16px] tabular-nums outline-none focus:bg-white/15"
      />
    </label>
  );
}

export function Slider({
  value,
  onChange,
  label,
  left,
  right,
  min = 0,
  max = 1,
  step = 0.05,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  left?: string;
  right?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[12px] text-white/55">
        <span>{label}</span>
        <span>
          {left} · {right}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-white text-black',
    secondary: 'bg-white/12 text-white',
    danger: 'bg-[#ff3b30]/90 text-white',
    ghost: 'bg-transparent text-white/80',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] px-3.5 text-[14px] font-semibold transition-opacity active:opacity-70 disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export const TextInputClass =
  'h-10 w-full rounded-[10px] bg-white/10 px-3 text-[16px] outline-none placeholder:text-white/35 focus:bg-white/15';
