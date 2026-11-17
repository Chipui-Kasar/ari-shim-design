'use client';

import { useMemo } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { validateLayout } from '@/lib/layout';
import {
  COUNTER_MATERIALS,
  FLOOR_SWATCHES,
  RACK_MATERIALS,
  SHELF_MATERIALS,
  WALL_SWATCHES,
} from '@/lib/materials';
import { formatFeetInches } from '@/lib/units';
import type { ObjectId, WallId, WallMode } from '@/types/pharmacy';
import { ColorRow, NumberField, Section, Segmented, SwatchRow, Toggle } from '@/components/editor/ui';
import { IconCheck, IconInfo, IconSun, IconWarn, IconX } from '@/components/editor/icons';

const OBJECTS: Array<{ id: ObjectId; label: string; sub: string }> = [
  { id: 'cosmetics', label: 'Cosmetics shelving', sub: 'Left wall' },
  { id: 'counter', label: 'L-shaped counter table', sub: 'Open front, curve to the street' },
  { id: 'rxRacks', label: 'Rx medicine racks', sub: 'Behind the counter' },
  { id: 'otcRacks', label: 'OTC medicine racks', sub: 'Right wall' },
  { id: 'backCabinets', label: 'Back stock cabinets', sub: 'Back wall' },
  { id: 'door', label: 'Glass entrance door', sub: 'Open front, swung fully open' },
];

const WALLS: Array<{ id: WallId; label: string }> = [
  { id: 'front', label: 'Front fascia & door' },
  { id: 'back', label: 'Back wall' },
  { id: 'left', label: 'Left wall' },
  { id: 'right', label: 'Right wall' },
  { id: 'ceiling', label: 'Ceiling' },
];

const MODES: Array<{ id: WallMode; label: string }> = [
  { id: 'visible', label: 'Show' },
  { id: 'ghost', label: 'Ghost' },
  { id: 'hidden', label: 'Hide' },
];

export function ValidationList() {
  const config = usePharmacyStore((s) => s.config);
  const layout = usePharmacyStore((s) => s.layout);
  const checks = useMemo(() => validateLayout(config, layout), [config, layout]);
  const icon = (s: string) =>
    s === 'pass' ? <IconCheck className="text-[#3f8f56]" /> : s === 'warn' ? <IconWarn className="text-[#c98a1b]" /> : s === 'fail' ? <IconX className="text-[#c0463f]" /> : <IconInfo className="text-[#6b8aa6]" />;
  return (
    <ul className="space-y-2">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-2 rounded-lg bg-[#f5f8f6] p-2">
          <span className="mt-0.5 shrink-0">{icon(c.status)}</span>
          <span className="min-w-0">
            <span className="block text-[12px] font-semibold text-[#24332f]">{c.label}</span>
            <span className="block text-[11px] leading-snug text-[#66766f]">{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** LEFT sidebar – configuration of the whole pharmacy. */
export function Sidebar() {
  const config = usePharmacyStore((s) => s.config);
  const patch = usePharmacyStore((s) => s.patchConfig);
  const reset = usePharmacyStore((s) => s.resetConfig);
  const select = usePharmacyStore((s) => s.select);
  const selected = usePharmacyStore((s) => s.selectedId);
  const walls = usePharmacyStore((s) => s.walls);
  const setWall = usePharmacyStore((s) => s.setWallMode);
  const cutaway = usePharmacyStore((s) => s.cutaway);
  const setCutaway = usePharmacyStore((s) => s.setCutaway);

  const { room, cosmetics, medicine, backCabinets, counter, finishes, lighting } = config;
  const area = Math.round(((room.width * room.length) / 144) * 10) / 10;
  const maxLf = room.width - cosmetics.depth - 24;
  const maxLs = room.length - backCabinets.depth - 12;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#e3e8e5] px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a9893]">Design</div>
        <div className="mt-0.5 text-[13px] text-[#35443f]">
          {formatFeetInches(room.width)} × {formatFeetInches(room.length)} · <span className="font-semibold">{area} sq ft</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Room configuration" defaultOpen>
          <NumberField label="Width" value={room.width} min={84} max={180} step={1} onChange={(v) => patch('room', { width: v })} />
          <NumberField label="Length" value={room.length} min={108} max={240} step={1} onChange={(v) => patch('room', { length: v })} />
          <NumberField label="Ceiling height" value={room.height} min={96} max={168} step={1} onChange={(v) => patch('room', { height: v })} />
          <button
            type="button"
            onClick={() => patch('room', { width: 108, length: 144, height: 120 })}
            className="w-full rounded-lg border border-[#cfdad2] bg-white py-1.5 text-[12px] font-medium text-[#3f6a43] hover:bg-[#f1f6f2]"
          >
            Reset to 9 × 12 ft · 10 ft ceiling
          </button>
        </Section>

        <Section title="Furniture & fixtures" defaultOpen>
          <ul className="-mx-1 space-y-1">
            {OBJECTS.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => select(o.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                    selected === o.id ? 'bg-[#e6f1e4] ring-1 ring-[#6f9a6a]' : 'hover:bg-[#f1f5f2]'
                  }`}
                >
                  <span>
                    <span className="block text-[12.5px] font-semibold text-[#24332f]">{o.label}</span>
                    <span className="block text-[11px] text-[#7d8d88]">{o.sub}</span>
                  </span>
                  <span className="text-[11px] text-[#8a9893]">Edit ›</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Cosmetics shelving">
          <SwatchRow label="Shelf material" value={cosmetics.material} options={SHELF_MATERIALS} onChange={(v) => patch('cosmetics', { material: v })} />
          <NumberField label="Shelf height (top)" value={cosmetics.topHeight} min={60} max={96} onChange={(v) => patch('cosmetics', { topHeight: v })} note="Shelves run from the plinth up to this height." />
          <NumberField label="Shelf spacing" value={cosmetics.spacing} min={10} max={22} step={0.5} onChange={(v) => patch('cosmetics', { spacing: v })} />
          <NumberField label="Shelf depth" value={cosmetics.depth} min={8} max={20} step={0.5} onChange={(v) => patch('cosmetics', { depth: v })} />
          <NumberField label="Plinth height" value={cosmetics.plinth} min={6} max={18} onChange={(v) => patch('cosmetics', { plinth: v })} />
          <NumberField label="Glass premium bays" value={cosmetics.glassSections} min={0} max={4} step={1} unit="" onChange={(v) => patch('cosmetics', { glassSections: v })} />
        </Section>

        <Section title="Medicine shelving">
          <SwatchRow label="Rack material" value={medicine.material} options={RACK_MATERIALS} onChange={(v) => patch('medicine', { material: v })} />
          <NumberField label="Rack height" value={medicine.rackHeight} min={72} max={110} onChange={(v) => patch('medicine', { rackHeight: v })} />
          <NumberField label="Shelf spacing" value={medicine.spacing} min={8} max={20} step={0.5} onChange={(v) => patch('medicine', { spacing: v })} />
          <NumberField label="Rack depth" value={medicine.rackDepth} min={6} max={18} step={0.5} onChange={(v) => patch('medicine', { rackDepth: v })} />
          <div className="my-1 border-t border-dashed border-[#dbe3de]" />
          <SwatchRow label="Back cabinet material" value={backCabinets.material} options={RACK_MATERIALS} onChange={(v) => patch('backCabinets', { material: v })} />
          <NumberField label="Back cabinet depth" value={backCabinets.depth} min={8} max={30} step={0.5} onChange={(v) => patch('backCabinets', { depth: v })} />
          <NumberField label="Back cabinet height" value={backCabinets.height} min={72} max={110} onChange={(v) => patch('backCabinets', { height: v })} />
        </Section>

        <Section title="Counter design">
          <SwatchRow label="Counter front" value={counter.material} options={COUNTER_MATERIALS} onChange={(v) => patch('counter', { material: v })} />
          <NumberField label="Side leg length (right wall)" value={counter.sideLength} min={Math.min(maxLs, counter.depth + medicine.rackDepth + 36)} max={maxLs} onChange={(v) => patch('counter', { sideLength: v })} />
          <NumberField label="Front leg length (across front)" value={counter.frontLength} min={Math.min(maxLf, counter.depth + medicine.rackDepth + 24)} max={maxLf} onChange={(v) => patch('counter', { frontLength: v })} />
          <NumberField label="Counter depth" value={counter.depth} min={16} max={28} step={0.5} onChange={(v) => patch('counter', { depth: v })} />
          <NumberField label="Counter height" value={counter.height} min={32} max={44} step={0.5} onChange={(v) => patch('counter', { height: v })} />
        </Section>

        <Section title="Materials & colours">
          <ColorRow label="Wall colour" value={finishes.wallColor} swatches={WALL_SWATCHES} onChange={(v) => v && patch('finishes', { wallColor: v })} />
          <ColorRow label="Floor tile colour" value={finishes.floorColor} swatches={FLOOR_SWATCHES} onChange={(v) => v && patch('finishes', { floorColor: v })} />
          <Segmented
            label="Tile size"
            value={String(finishes.tileSize)}
            options={[{ id: '12', label: '12"' }, { id: '24', label: '24"' }, { id: '32', label: '32"' }]}
            onChange={(v) => patch('finishes', { tileSize: Number(v) })}
          />
        </Section>

        <Section title="Lighting" icon={<IconSun />}>
          <NumberField label="Intensity" value={Math.round(lighting.intensity * 100)} min={20} max={200} step={5} unit="%" onChange={(v) => patch('lighting', { intensity: v / 100 })} />
          <NumberField label="Colour temperature" value={lighting.temperature} min={2700} max={6500} step={100} unit="K" onChange={(v) => patch('lighting', { temperature: v })} note="4000 K neutral white is the design target." />
          <Toggle label="Recessed downlights" checked={lighting.downlights} onChange={(v) => patch('lighting', { downlights: v })} />
          <Toggle label="Shelf & cabinet LEDs" checked={lighting.shelfLeds} onChange={(v) => patch('lighting', { shelfLeds: v })} />
          <Toggle label="Ceiling cove & linear light" checked={lighting.cove} onChange={(v) => patch('lighting', { cove: v })} />
          <Toggle label="Counter toe-kick glow" checked={lighting.counterLight} onChange={(v) => patch('lighting', { counterLight: v })} />
          <Segmented
            label="Render quality"
            value={lighting.quality}
            options={[{ id: 'low', label: 'Fast' }, { id: 'medium', label: 'Balanced' }, { id: 'high', label: 'Best' }]}
            onChange={(v) => patch('lighting', { quality: v })}
          />
        </Section>

        <Section title="Walls & cutaway">
          <Toggle label="Complete cutaway" hint="Hides every wall and the ceiling" checked={cutaway} onChange={setCutaway} />
          <div className="space-y-2">
            {WALLS.map((w) => (
              <Segmented key={w.id} label={w.label} value={walls[w.id]} options={MODES} onChange={(m) => setWall(w.id, m)} />
            ))}
          </div>
        </Section>

        <Section title="Layout validation" defaultOpen>
          <ValidationList />
        </Section>
      </div>

      <div className="border-t border-[#e3e8e5] p-3">
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-lg bg-[#eef2ef] py-2 text-[12.5px] font-semibold text-[#41524c] hover:bg-[#e3e9e5]"
        >
          Reset entire design
        </button>
      </div>
    </div>
  );
}
