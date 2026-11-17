'use client';

import { usePharmacyStore } from '@/store/pharmacyStore';
import { formatFeetInches } from '@/lib/units';
import { COUNTER_MATERIALS, FRAME_MATERIALS, RACK_MATERIALS, SHELF_MATERIALS, TINT_SWATCHES } from '@/lib/materials';
import type { MaterialId, ObjectId } from '@/types/pharmacy';
import { ColorRow, NumberField, SwatchRow } from '@/components/editor/ui';
import { IconDoor, IconLock, IconX } from '@/components/editor/icons';
import { ValidationList } from '@/components/editor/Sidebar';

interface Dim {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange?: (v: number) => void;
  note?: string;
}

interface Model {
  title: string;
  desc: string;
  dims: Dim[];
  extras: Dim[];
  materials: MaterialId[];
  material: MaterialId;
  tint: string | null | undefined;
  setMaterial: (m: MaterialId) => void;
  setTint?: (t: string | null) => void;
}

/** RIGHT sidebar – properties of the selected object (dimensions, position, material, colour). */
export function PropertiesPanel() {
  const config = usePharmacyStore((s) => s.config);
  const layout = usePharmacyStore((s) => s.layout);
  const selected = usePharmacyStore((s) => s.selectedId);
  const patch = usePharmacyStore((s) => s.patchConfig);
  const select = usePharmacyStore((s) => s.select);
  const doorOpen = usePharmacyStore((s) => s.doorOpen);
  const toggleDoor = usePharmacyStore((s) => s.toggleDoor);

  const { cosmetics, medicine, backCabinets, counter, door, room } = config;

  const models: Record<ObjectId, Model> = {
    cosmetics: {
      title: 'Cosmetics shelving',
      desc: 'Oak shelves in an aluminium frame with LED strips, glass premium bays and category signage.',
      dims: [
        { label: 'Width (along wall)', value: layout.cosmetics.length, min: 0, max: 999, note: 'Fills the left wall up to the back cabinets.' },
        { label: 'Height', value: cosmetics.topHeight, min: 60, max: 96, onChange: (v) => patch('cosmetics', { topHeight: v }) },
        { label: 'Depth', value: cosmetics.depth, min: 8, max: 20, step: 0.5, onChange: (v) => patch('cosmetics', { depth: v }) },
      ],
      extras: [
        { label: 'Shelf spacing', value: cosmetics.spacing, min: 10, max: 22, step: 0.5, onChange: (v) => patch('cosmetics', { spacing: v }) },
        { label: 'Plinth height', value: cosmetics.plinth, min: 6, max: 18, onChange: (v) => patch('cosmetics', { plinth: v }) },
        { label: 'Glass premium bays', value: cosmetics.glassSections, min: 0, max: 4, step: 1, onChange: (v) => patch('cosmetics', { glassSections: v }) },
      ],
      materials: SHELF_MATERIALS,
      material: cosmetics.material,
      tint: cosmetics.tint,
      setMaterial: (m) => patch('cosmetics', { material: m }),
      setTint: (t) => patch('cosmetics', { tint: t }),
    },
    rxRacks: {
      title: 'Rx medicine racks',
      desc: 'Dispensing racks behind the counter: closed lower cabinets, lockable drawers, open shelves and closed upper cabinets.',
      dims: [
        { label: 'Width (right wall run)', value: layout.rxRight.length, min: 0, max: 999, note: 'Set by the counter side-leg length.' },
        { label: 'Height', value: medicine.rackHeight, min: 72, max: 110, onChange: (v) => patch('medicine', { rackHeight: v }) },
        { label: 'Depth', value: medicine.rackDepth, min: 6, max: 18, step: 0.5, onChange: (v) => patch('medicine', { rackDepth: v }) },
      ],
      extras: [{ label: 'Shelf spacing', value: medicine.spacing, min: 8, max: 20, step: 0.5, onChange: (v) => patch('medicine', { spacing: v }) }],
      materials: RACK_MATERIALS,
      material: medicine.material,
      tint: medicine.tint,
      setMaterial: (m) => patch('medicine', { material: m }),
      setTint: (t) => patch('medicine', { tint: t }),
    },
    otcRacks: {
      title: 'OTC medicine racks',
      desc: 'Self-service first-aid, vitamins and healthcare shelving along the right wall.',
      dims: [
        { label: 'Width (right wall run)', value: layout.otcRight.length, min: 0, max: 999, note: 'Between the counter and the back cabinets.' },
        { label: 'Height', value: medicine.rackHeight, min: 72, max: 110, onChange: (v) => patch('medicine', { rackHeight: v }) },
        { label: 'Depth', value: medicine.rackDepth, min: 6, max: 18, step: 0.5, onChange: (v) => patch('medicine', { rackDepth: v }) },
      ],
      extras: [{ label: 'Shelf spacing', value: medicine.spacing, min: 8, max: 20, step: 0.5, onChange: (v) => patch('medicine', { spacing: v }) }],
      materials: RACK_MATERIALS,
      material: medicine.material,
      tint: medicine.tint,
      setMaterial: (m) => patch('medicine', { material: m }),
      setTint: (t) => patch('medicine', { tint: t }),
    },
    backCabinets: {
      title: 'Back stock cabinets',
      desc: 'Closed stock and inventory storage across the full back wall, matching the right-wall racks.',
      dims: [
        { label: 'Width (back wall)', value: layout.back.length, min: 0, max: 999, note: 'Spans the full room width.' },
        { label: 'Height', value: backCabinets.height, min: 72, max: 110, onChange: (v) => patch('backCabinets', { height: v }) },
        { label: 'Depth', value: backCabinets.depth, min: 8, max: 30, step: 0.5, onChange: (v) => patch('backCabinets', { depth: v }) },
      ],
      extras: [],
      materials: RACK_MATERIALS,
      material: backCabinets.material,
      tint: backCabinets.tint,
      setMaterial: (m) => patch('backCabinets', { material: m }),
      setTint: (t) => patch('backCabinets', { tint: t }),
    },
    counter: {
      title: 'L-shaped counter',
      desc: 'Dispensing & billing counter table at the open front, rounded corner facing the street: fluted oak front, solid-surface top, drawers and workstation.',
      dims: [
        { label: 'Side leg length (right wall)', value: counter.sideLength, min: Math.min(room.length - backCabinets.depth - 12, counter.depth + medicine.rackDepth + 36), max: room.length - backCabinets.depth - 12, onChange: (v) => patch('counter', { sideLength: v }) },
        { label: 'Front table length (across front)', value: counter.frontLength, min: Math.min(room.width - cosmetics.depth - 24, counter.depth + medicine.rackDepth + 24), max: room.width - cosmetics.depth - 24, onChange: (v) => patch('counter', { frontLength: v }) },
        { label: 'Height', value: counter.height, min: 32, max: 44, step: 0.5, onChange: (v) => patch('counter', { height: v }) },
        { label: 'Depth', value: counter.depth, min: 16, max: 28, step: 0.5, onChange: (v) => patch('counter', { depth: v }) },
      ],
      extras: [],
      materials: COUNTER_MATERIALS,
      material: counter.material,
      tint: counter.tint,
      setMaterial: (m) => patch('counter', { material: m }),
      setTint: (t) => patch('counter', { tint: t }),
    },
    door: {
      title: 'Roller shutter',
      desc: 'There is no door: the full-width shopfront closes with a push-up / pull-down roller shutter running in guide rails, with a lockable bottom bar. The fascia above carries the KK Pharmacy signboard.',
      dims: [
        { label: 'Width (full shopfront)', value: room.width, min: 0, max: 999, note: 'Set by the room width.' },
        { label: 'Opening height', value: door.height, min: 80, max: Math.min(110, room.height - 10), onChange: (v) => patch('door', { height: v }), note: 'The fascia beam fills the rest up to the ceiling.' },
      ],
      extras: [],
      materials: FRAME_MATERIALS,
      material: door.frame,
      tint: undefined,
      setMaterial: (m) => patch('door', { frame: m }),
    },
  };

  if (!selected) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[#e3e8e5] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a9893]">Properties</div>
          <div className="mt-1 text-[13px] text-[#35443f]">Nothing selected</div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <p className="rounded-xl border border-dashed border-[#cfdad2] bg-[#f6f9f7] p-3 text-[12.5px] leading-relaxed text-[#56665f]">
            Click any fixture in the 3D view – shelves, counter, racks, cabinets or the door – to see and edit its
            dimensions, position, material and colour.
          </p>
          <div>
            <div className="mb-2 text-[12px] font-semibold text-[#24332f]">Design checks</div>
            <ValidationList />
          </div>
        </div>
      </div>
    );
  }

  const m = models[selected];
  const box = layout.bounds[selected][0];
  const px = box.min[0];
  const py = -box.max[2];
  const elev = box.min[1];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-[#e3e8e5] px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a9893]">Selected</div>
          <div className="mt-0.5 text-[15px] font-semibold text-[#1d2b27]">{m.title}</div>
        </div>
        <button type="button" onClick={() => select(null)} className="rounded-md p-1 text-[#7d8d88] hover:bg-[#eef2ef]" aria-label="Deselect">
          <IconX width={16} height={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <p className="text-[12px] leading-relaxed text-[#66766f]">{m.desc}</p>

        <div className="space-y-3.5">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[#8a9893]">Dimensions</div>
          {m.dims.map((d) => (
            <NumberField key={d.label} label={d.label} value={d.value} min={d.min} max={d.max} step={d.step ?? 1} onChange={d.onChange} readOnly={!d.onChange} note={d.note} />
          ))}
          {m.extras.map((d) => (
            <NumberField key={d.label} label={d.label} value={d.value} min={d.min} max={d.max} step={d.step ?? 1} onChange={d.onChange} unit={d.label.includes('bays') ? '' : 'in'} />
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#8a9893]">
            Position <IconLock width={12} height={12} />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['From left wall', px],
              ['From front wall', py],
              ['Elevation', elev],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-lg bg-[#f3f6f4] p-2">
                <dt className="text-[10px] text-[#8a9893]">{k}</dt>
                <dd className="mt-0.5 text-[12.5px] font-semibold tabular-nums text-[#24332f]">{formatFeetInches(v as number)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-1.5 text-[11px] text-[#8a9893]">Fixtures are anchored to the walls; resize them to re-flow the layout.</p>
        </div>

        <SwatchRow label="Material" value={m.material} options={m.materials} onChange={m.setMaterial} />
        {m.setTint && (
          <ColorRow label="Colour tint" value={m.tint ?? null} swatches={TINT_SWATCHES} onChange={(t) => m.setTint?.(t)} allowClear />
        )}

        {selected === 'door' && (
          <button
            type="button"
            onClick={toggleDoor}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6f9a6a] py-2 text-[13px] font-semibold text-white hover:bg-[#5f8a5a]"
          >
            <IconDoor /> {doorOpen ? 'Pull down shutter' : 'Push up shutter'}
          </button>
        )}
      </div>
    </div>
  );
}
