'use client';

import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { usePharmacyStore } from '@/store/pharmacyStore';
import type { ObjectId } from '@/types/pharmacy';
import type { Box3Like } from '@/lib/layout';
import { formatFeetInches } from '@/lib/units';

function edges(b: Box3Like): Array<[number, number, number]> {
  const [x0, y0, z0] = b.min;
  const [x1, y1, z1] = b.max;
  const c = (x: number, y: number, z: number): [number, number, number] => [x, y, z];
  const pairs: Array<[[number, number, number], [number, number, number]]> = [
    [c(x0, y0, z0), c(x1, y0, z0)], [c(x1, y0, z0), c(x1, y0, z1)], [c(x1, y0, z1), c(x0, y0, z1)], [c(x0, y0, z1), c(x0, y0, z0)],
    [c(x0, y1, z0), c(x1, y1, z0)], [c(x1, y1, z0), c(x1, y1, z1)], [c(x1, y1, z1), c(x0, y1, z1)], [c(x0, y1, z1), c(x0, y1, z0)],
    [c(x0, y0, z0), c(x0, y1, z0)], [c(x1, y0, z0), c(x1, y1, z0)], [c(x1, y0, z1), c(x1, y1, z1)], [c(x0, y0, z1), c(x0, y1, z1)],
  ];
  return pairs.flat();
}

function Outline({ id, color, label }: { id: ObjectId; color: string; label: boolean }) {
  const boxes = usePharmacyStore((s) => s.layout.bounds[id]);
  const geo = useMemo(() => boxes.map((b) => edges(b)), [boxes]);
  const first = boxes[0];
  const size = first ? [first.max[0] - first.min[0], first.max[1] - first.min[1], first.max[2] - first.min[2]] : [0, 0, 0];

  return (
    <group>
      {geo.map((pts, i) => (
        <Line key={i} points={pts} segments color={color} lineWidth={2} transparent opacity={0.95} depthTest={false} renderOrder={20} />
      ))}
      {label && first && (
        <Html position={[(first.min[0] + first.max[0]) / 2, first.max[1] + 4, (first.min[2] + first.max[2]) / 2]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-md bg-[#1f3a33] px-2 py-1 text-[11px] font-medium text-white shadow-lg">
            {formatFeetInches(Math.max(size[0], size[2]))} × {formatFeetInches(Math.min(size[0], size[2]))} × {formatFeetInches(size[1])}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Highlights the hovered and the selected object, with its overall dimensions. */
export function SelectionBox() {
  const selected = usePharmacyStore((s) => s.selectedId);
  const hovered = usePharmacyStore((s) => s.hoveredId);
  const view = usePharmacyStore((s) => s.view);
  if (view === 'walkthrough') return null;
  return (
    <>
      {hovered && hovered !== selected && <Outline id={hovered} color="#9ec9bd" label={false} />}
      {selected && <Outline id={selected} color="#19b394" label />}
    </>
  );
}
