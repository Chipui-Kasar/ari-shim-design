'use client';

import { usePharmacyStore } from '@/store/pharmacyStore';
import { formatFeetInches } from '@/lib/units';
import { IconPanelLeft, IconPanelRight, IconReset, IconRuler, LogoMark } from '@/components/editor/icons';

/** TOP navigation – identity, project, room size, reset + panel toggles. */
export function TopBar() {
  const room = usePharmacyStore((s) => s.config.room);
  const resetView = usePharmacyStore((s) => s.resetView);
  const showDims = usePharmacyStore((s) => s.showDimensions);
  const toggleDims = usePharmacyStore((s) => s.toggleDimensions);
  const leftOpen = usePharmacyStore((s) => s.leftOpen);
  const rightOpen = usePharmacyStore((s) => s.rightOpen);
  const setLeft = usePharmacyStore((s) => s.setLeftOpen);
  const setRight = usePharmacyStore((s) => s.setRightOpen);
  const area = Math.round((room.width * room.length) / 144);

  const btn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ${
      active ? 'bg-[#e6f1e4] text-[#2a4a2c]' : 'text-[#51615c] hover:bg-[#eef3ef]'
    }`;

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-3 border-b border-[#e3e8e5] bg-white px-3 sm:px-4">
      <button type="button" onClick={() => setLeft(!leftOpen)} className={`${btn(leftOpen)} lg:hidden`} aria-label="Toggle design panel">
        <IconPanelLeft />
      </button>

      <div className="flex min-w-0 items-center gap-2.5">
        <LogoMark />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[14px] font-bold tracking-tight text-[#1d2b27]">Pharmacy Interior Designer</div>
          <div className="hidden truncate text-[11px] text-[#7d8d88] sm:block">KK Pharmacy · Medicine & Cosmetics</div>
        </div>
      </div>

      <div className="mx-2 hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f1f5f2] px-3 py-1 text-[12px] font-medium text-[#41524c] lg:flex">
        <span className="tabular-nums">
          {formatFeetInches(room.width)} × {formatFeetInches(room.length)} × {formatFeetInches(room.height)}
        </span>
        <span className="text-[#9aa8a3]">·</span>
        <span className="tabular-nums">{area} sq ft</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button type="button" onClick={toggleDims} className={btn(showDims)} aria-pressed={showDims}>
          <IconRuler /> <span className="hidden sm:inline">Dimensions</span>
        </button>
        <button type="button" onClick={resetView} className={btn(false)}>
          <IconReset /> <span className="hidden sm:inline">Reset view</span>
        </button>
        <button type="button" onClick={() => setLeft(!leftOpen)} className={`${btn(leftOpen)} hidden lg:flex`} aria-label="Toggle design panel" aria-pressed={leftOpen}>
          <IconPanelLeft />
        </button>
        <button type="button" onClick={() => setRight(!rightOpen)} className={btn(rightOpen)} aria-label="Toggle properties panel" aria-pressed={rightOpen}>
          <IconPanelRight />
        </button>
      </div>
    </header>
  );
}
