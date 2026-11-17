'use client';

import { usePharmacyStore } from '@/store/pharmacyStore';
import { walkInput } from '@/lib/walkInput';

function Pad({ label, k }: { label: string; k: 'forward' | 'back' | 'left' | 'right' }) {
  const set = (v: boolean) => () => {
    walkInput[k] = v;
  };
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        walkInput[k] = true;
      }}
      onPointerUp={set(false)}
      onPointerLeave={set(false)}
      onPointerCancel={set(false)}
      className="flex h-12 w-12 select-none items-center justify-center rounded-xl bg-white/85 text-lg font-bold text-[#41524c] shadow active:bg-[#cfe2cc]"
    >
      {label}
    </button>
  );
}

/** Overlay shown only during the first-person walkthrough. */
export function WalkthroughHud() {
  const setView = usePharmacyStore((s) => s.setView);
  const open = usePharmacyStore((s) => s.doorOpen);
  const toggle = usePharmacyStore((s) => s.toggleDoor);
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-[#1f3a33]/90 px-4 py-1.5 text-center text-[12px] font-medium text-white shadow-lg">
        Click &amp; move the mouse to look · <b>W A S D</b> / arrows to walk · <b>Shift</b> to run · <b>Esc</b> frees the cursor
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 ring-1 ring-black/30" />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-16 rounded-xl bg-white/90 px-3 py-2 text-[12px] font-semibold text-[#2a4a2c] shadow hover:bg-white"
      >
        {open ? 'Pull down shutter' : 'Push up shutter'}
      </button>
      <button
        type="button"
        onClick={() => setView('perspective')}
        className="absolute right-3 top-3 rounded-xl bg-white/90 px-3 py-2 text-[12px] font-semibold text-[#2a4a2c] shadow hover:bg-white"
      >
        Exit walkthrough
      </button>
      {/* Touch controls (tablets) */}
      <div className="absolute bottom-24 left-4 hidden grid-cols-3 grid-rows-2 gap-1.5 [@media(pointer:coarse)]:grid">
        <span />
        <Pad label="▲" k="forward" />
        <span />
        <Pad label="◀" k="left" />
        <Pad label="▼" k="back" />
        <Pad label="▶" k="right" />
      </div>
    </>
  );
}
