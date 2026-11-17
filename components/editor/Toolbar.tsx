'use client';

import type { ReactNode } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { VIEW_LABELS } from '@/lib/views';
import type { ViewId } from '@/types/pharmacy';
import { IconCube, IconFront, IconLeft, IconPlan, IconRight, IconWalk } from '@/components/editor/icons';

const VIEWS: Array<{ id: ViewId; icon: ReactNode }> = [
  { id: 'perspective', icon: <IconCube /> },
  { id: 'top', icon: <IconPlan /> },
  { id: 'front', icon: <IconFront /> },
  { id: 'left', icon: <IconLeft /> },
  { id: 'right', icon: <IconRight /> },
  { id: 'walkthrough', icon: <IconWalk /> },
];

/** BOTTOM toolbar – camera views. */
export function Toolbar() {
  const view = usePharmacyStore((s) => s.view);
  const setView = usePharmacyStore((s) => s.setView);

  return (
    <nav
      aria-label="Camera views"
      className="pointer-events-auto flex max-w-[calc(100vw-24px)] items-center gap-1 overflow-x-auto rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-[0_10px_40px_-10px_rgba(20,40,32,0.35)] backdrop-blur"
    >
      {VIEWS.map((v) => {
        const active = view === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            aria-pressed={active}
            className={`flex min-w-[64px] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10.5px] font-semibold transition sm:min-w-[78px] sm:text-[11px] ${
              active ? 'bg-[#6f9a6a] text-white shadow' : 'text-[#51615c] hover:bg-[#eef3ef]'
            }`}
          >
            {v.icon}
            <span className="whitespace-nowrap">{VIEW_LABELS[v.id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
