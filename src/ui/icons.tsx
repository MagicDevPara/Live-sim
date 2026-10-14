import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number | undefined, props: P) => ({
  width: size ?? 24,
  height: size ?? 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const CloseIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const EyeIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const HeartIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 20.5s-7.5-4.4-9.3-9.2C1.4 7.6 3.8 4 7.3 4c2 0 3.4 1 4.7 2.7C13.3 5 14.7 4 16.7 4c3.5 0 5.9 3.6 4.6 7.3-1.8 4.8-9.3 9.2-9.3 9.2Z" />
  </svg>
);

export const SendIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M22 3 9.2 10.8M22 3l-7 18-3.4-7.8L4 10l18-7Z" />
  </svg>
);

export const MoreIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <circle cx="5" cy="12" r="1.9" />
    <circle cx="12" cy="12" r="1.9" />
    <circle cx="19" cy="12" r="1.9" />
  </svg>
);

export const QuestionIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.4-2.6 4" />
    <circle cx="12" cy="17.3" r=".6" fill="currentColor" />
  </svg>
);

export const FlipIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M20 8.5V7a2 2 0 0 0-2-2h-2.2l-1.5-2h-4.6L8.2 5H6a2 2 0 0 0-2 2v1.5" />
    <path d="M4 15.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
    <path d="m7 11 2-2 2 2M17 13l-2 2-2-2M9 9v3a3 3 0 0 0 3 3h3" />
  </svg>
);

export const PlayIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8Z" />
  </svg>
);

export const PauseIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
  </svg>
);

export const StopIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
  </svg>
);

export const EditIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
  </svg>
);

export const ChevronLeftIcon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
