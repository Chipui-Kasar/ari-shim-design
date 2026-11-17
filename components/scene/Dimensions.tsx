'use client';

import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { formatFeetInches } from '@/lib/units';

type V3 = [number, number, number];

interface Dim {
  a: V3;
  b: V3;
  label: string;
  /** perpendicular tick direction */
  tick: 'x' | 'z';
}

const Y = 0.8;

function DimLine({ d }: { d: Dim }) {
  const t = 3;
  const pts = useMemo<V3[]>(() => {
    const tk = (p: V3, s: number): [V3, V3] =>
      d.tick === 'x' ? [[p[0] - s, p[1], p[2]], [p[0] + s, p[1], p[2]]] : [[p[0], p[1], p[2] - s], [p[0], p[1], p[2] + s]];
    return [d.a, d.b, ...tk(d.a, t), ...tk(d.b, t)];
  }, [d, t]);
  const mid: V3 = [(d.a[0] + d.b[0]) / 2, Y + 1, (d.a[2] + d.b[2]) / 2];
  return (
    <group>
      <Line points={pts} segments color="#0f6b59" lineWidth={1.6} transparent opacity={0.95} renderOrder={15} />
      <Html position={mid} center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded border border-[#0f6b59]/40 bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-[#0f4f43] shadow-sm">
          {d.label}
        </div>
      </Html>
    </group>
  );
}

function Zone({ p, text, tone = 'neutral' }: { p: V3; text: string; tone?: 'neutral' | 'green' }) {
  return (
    <Html position={p} center zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
          tone === 'green' ? 'bg-[#7f9f7b] text-white' : 'bg-white/90 text-[#33403d]'
        }`}
      >
        {text}
      </div>
    </Html>
  );
}

/** Floor-plan measurements + zone labels (always shown in the Floor Plan view). */
export function Dimensions() {
  const layout = usePharmacyStore((s) => s.layout);
  const config = usePharmacyStore((s) => s.config);
  const visible = usePharmacyStore((s) => s.showDimensions || s.view === 'top');
  const view = usePharmacyStore((s) => s.view);

  const { W, L, counter, aisle, pocket } = layout;
  const cd = config.cosmetics.depth;
  const backD = config.backCabinets.depth;
  const R = config.medicine.rackDepth;
  const Ls = counter.sideLength;

  const dims = useMemo<Dim[]>(() => {
    const f = formatFeetInches;
    return [
      { a: [0, Y, -(L + 18)], b: [W, Y, -(L + 18)], label: `Width ${f(W)}`, tick: 'z' },
      { a: [-20, Y, 0], b: [-20, Y, -L], label: `Length ${f(L)}`, tick: 'x' },
      { a: [aisle.x0, Y, -L * 0.7], b: [aisle.x1, Y, -L * 0.7], label: `Aisle ${f(aisle.width)}`, tick: 'z' },
      { a: [0, Y, -L * 0.74], b: [cd, Y, -L * 0.74], label: f(cd), tick: 'z' },
      { a: [W + 16, Y, 0], b: [W + 16, Y, -Ls], label: `Counter ${f(Ls)}`, tick: 'x' },
      { a: [counter.x0, Y, 9], b: [W, Y, 9], label: `Counter table ${f(counter.frontLength)}`, tick: 'z' },
      { a: [counter.x0, Y, -(Ls + 9)], b: [counter.x0 + counter.depth, Y, -(Ls + 9)], label: `${f(counter.depth)} deep`, tick: 'z' },
      { a: [layout.door.x0, Y, 18], b: [layout.door.x1, Y, 18], label: `Door ${f(layout.door.width)}`, tick: 'z' },
      { a: [W + 14, Y, -(L - backD)], b: [W + 14, Y, -L], label: `Back ${f(backD)}`, tick: 'x' },
    ];
  }, [W, L, cd, backD, Ls, counter, aisle, layout.door]);

  if (!visible || view === 'walkthrough') return null;

  const pocketW = pocket.x1 - pocket.x0;
  const pocketD = pocket.y1 - pocket.y0;
  return (
    <group>
      {dims.map((d, i) => (
        <DimLine key={i} d={d} />
      ))}
      <Zone p={[cd / 2, 1, -L * 0.18]} text="Cosmetics" tone="green" />
      <Zone p={[(aisle.x0 + aisle.x1) / 2, 1, -L * 0.4]} text="Customer aisle" />
      <Zone p={[(pocket.x0 + pocket.x1) / 2 - 8, 1, -(pocket.y0 + pocketD * 0.5)]} text={`Pharmacist ${formatFeetInches(pocketW)}×${formatFeetInches(pocketD)}`} tone="green" />
      <Zone p={[counter.x0 + counter.depth / 2 - 4, 1, -Ls * 0.3]} text="L-counter" />
      <Zone p={[W - R / 2, 1, -(Ls + (L - backD - Ls) / 2)]} text="OTC" />
      <Zone p={[W / 2, 1, -(L - backD / 2)]} text="Back storage" tone="green" />
      <Zone p={[(aisle.x0 + aisle.x1) / 2, 1, 30]} text="Open entrance ▼" />
    </group>
  );
}
