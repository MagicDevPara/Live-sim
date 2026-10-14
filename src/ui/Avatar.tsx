import { memo } from 'react';
import type { Profile } from '../core/types';

function background(hue: number, style: number): string {
  const h2 = (hue + 38) % 360;
  switch (style) {
    case 0:
      return `linear-gradient(135deg, hsl(${hue} 72% 58%), hsl(${h2} 78% 44%))`;
    case 1:
      return `hsl(${hue} 38% 42%)`;
    case 2:
      return `radial-gradient(circle at 30% 25%, hsl(${hue} 80% 72%), hsl(${hue} 55% 34%))`;
    case 3:
      return `linear-gradient(160deg, hsl(${hue} 25% 78%), hsl(${h2} 30% 52%))`;
    default:
      return `linear-gradient(135deg, hsl(${hue} 60% 86%), hsl(${h2} 55% 70%))`;
  }
}

interface Props {
  profile: Pick<Profile, 'hue' | 'style' | 'initials' | 'glyph' | 'image'>;
  size: number;
  ring?: boolean;
}

/** Генерируемая аватарка: градиент + инициал или эмодзи; у стримера — загруженное фото. */
export const Avatar = memo(function Avatar({ profile, size, ring }: Props) {
  const inner = profile.image ? (
    <img src={profile.image} alt="" className="h-full w-full rounded-full object-cover" draggable={false} />
  ) : (
    <div
      className="grid h-full w-full place-items-center rounded-full font-semibold text-white"
      style={{ background: background(profile.hue, profile.style), fontSize: size * (profile.glyph ? 0.5 : 0.42) }}
    >
      <span style={profile.glyph ? undefined : { textShadow: '0 1px 1px rgba(0,0,0,.25)' }}>
        {profile.glyph ?? profile.initials}
      </span>
    </div>
  );

  if (!ring) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        {inner}
      </div>
    );
  }
  return (
    <div
      className="shrink-0 rounded-full p-[2px]"
      style={{ width: size, height: size, background: 'conic-gradient(from 210deg, #ff2d55, #ff7a1a, #ffc23d, #ff2d55)' }}
    >
      <div className="h-full w-full rounded-full bg-black p-[1.5px]">{inner}</div>
    </div>
  );
});
