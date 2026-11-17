'use client';

import { useMemo } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { WALL_THICKNESS } from '@/lib/layout';
import { getPaintMaterial } from '@/lib/materials';
import { Slab, getGhostMaterial } from '@/components/scene/primitives';

const EXTERIOR = '#e7e6e1';

/** Left, right and back walls. (The front wall lives in Entrance.tsx.) */
export function Walls() {
  const walls = usePharmacyStore((s) => s.walls);
  const layout = usePharmacyStore((s) => s.layout);
  const wallColor = usePharmacyStore((s) => s.config.finishes.wallColor);
  const T = WALL_THICKNESS;
  const { W, L, H } = layout;

  const mats = useMemo(() => {
    const inside = getPaintMaterial(wallColor);
    const outside = getPaintMaterial(EXTERIOR);
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    return {
      left: [inside, outside, outside, outside, outside, outside],
      right: [outside, inside, outside, outside, outside, outside],
      back: [outside, outside, outside, outside, inside, outside],
    };
  }, [wallColor]);

  const ghost = getGhostMaterial('#cfd6d4', 0.2);
  const pick = (mode: string, solid: (typeof mats)['left']) => (mode === 'ghost' ? ghost : solid);

  return (
    <group>
      {walls.left !== 'hidden' && (
        <Slab
          x={-T} y={0} z={-(L + T)} w={T} h={H} d={L + 2 * T}
          material={pick(walls.left, mats.left)}
          cast={walls.left === 'visible'}
          noRaycast={walls.left === 'ghost'}
        />
      )}
      {walls.right !== 'hidden' && (
        <Slab
          x={W} y={0} z={-(L + T)} w={T} h={H} d={L + 2 * T}
          material={pick(walls.right, mats.right)}
          cast={walls.right === 'visible'}
          noRaycast={walls.right === 'ghost'}
        />
      )}
      {walls.back !== 'hidden' && (
        <Slab
          x={0} y={0} z={-(L + T)} w={W} h={H} d={T}
          material={pick(walls.back, mats.back)}
          cast={walls.back === 'visible'}
          noRaycast={walls.back === 'ghost'}
        />
      )}
    </group>
  );
}
