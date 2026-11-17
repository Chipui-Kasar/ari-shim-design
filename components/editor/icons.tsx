import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (children: ReactNode, p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden {...p}>
    {children}
  </svg>
);

export const IconCube = (p: P) => base(<><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>, p);
export const IconPlan = (p: P) => base(<><rect x="3.5" y="3.5" width="17" height="17" rx="1.5" /><path d="M3.5 12h7M12 3.5v6M15 12h5.5M15 12v8.5" /></>, p);
export const IconFront = (p: P) => base(<><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M9 20v-8h6v8M4 9h16" /></>, p);
export const IconLeft = (p: P) => base(<><path d="M4 4v16" /><path d="M8 7h9M8 12h9M8 17h9" /><path d="M20 4v16" opacity=".35" /></>, p);
export const IconRight = (p: P) => base(<><path d="M20 4v16" /><path d="M7 7h9M7 12h9M7 17h9" /><path d="M4 4v16" opacity=".35" /></>, p);
export const IconWalk = (p: P) => base(<><circle cx="13" cy="4.5" r="1.8" /><path d="m9 21 2-6-2-3 3-4 3 3 3 1M11 15l3 2 1 4M9 12 7 15" /></>, p);
export const IconReset = (p: P) => base(<><path d="M4 12a8 8 0 1 0 2.6-5.9" /><path d="M4 4v4.5h4.5" /></>, p);
export const IconRuler = (p: P) => base(<><rect x="2.5" y="8" width="19" height="8" rx="1.5" /><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4" /></>, p);
export const IconPanelLeft = (p: P) => base(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>, p);
export const IconPanelRight = (p: P) => base(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></>, p);
export const IconChevron = (p: P) => base(<path d="m6 9 6 6 6-6" />, p);
export const IconLock = (p: P) => base(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, p);
export const IconCheck = (p: P) => base(<path d="m5 12.5 4.5 4.5L19 7.5" />, p);
export const IconWarn = (p: P) => base(<><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5M12 17.2v.1" /></>, p);
export const IconInfo = (p: P) => base(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.1" /></>, p);
export const IconX = (p: P) => base(<path d="m6 6 12 12M18 6 6 18" />, p);
export const IconDoor = (p: P) => base(<><path d="M6 20V4h9l3 2v14" /><path d="M4 20h16M12.5 12v.1" /></>, p);
export const IconSun = (p: P) => base(<><circle cx="12" cy="12" r="3.5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></>, p);

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#7fa27a" />
      <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6V7Z" fill="#fff" />
    </svg>
  );
}
