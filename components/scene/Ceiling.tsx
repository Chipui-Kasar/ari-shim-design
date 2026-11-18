'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { downlightPositions, stockLightPosition } from '@/lib/lighting';
import { getPaintMaterial } from '@/lib/materials';
import { Slab, Strips, useLedMaterials, getGhostMaterial, type StripItem } from '@/components/scene/primitives';

const ringGeo = new THREE.RingGeometry(2.35, 3.1, 40);
const discGeo = new THREE.CircleGeometry(2.35, 40);
const flatDown: [number, number, number] = [Math.PI / 2, 0, 0];

/** White gypsum false ceiling at exactly the configured height, with LED details. */
export function Ceiling() {
  const mode = usePharmacyStore((s) => s.walls.ceiling);
  const layout = usePharmacyStore((s) => s.layout);
  const color = usePharmacyStore((s) => s.config.finishes.ceilingColor);
  const lighting = usePharmacyStore((s) => s.config.lighting);
  const { led } = useLedMaterials();
  const { W, L, H, shopL } = layout;

  const trim = useMemo(() => getPaintMaterial('#f1f1ee', 0.5), []);
  const housing = useMemo(() => getPaintMaterial('#26282a', 0.5), []);
  const intensity = lighting.intensity;
  // Slight self-illumination stands in for bounce light off the white gypsum ceiling.
  const slabMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.95, emissive: color, emissiveIntensity: 0.5 * Math.min(1, intensity) }),
    [color, intensity],
  );
  const ghost = getGhostMaterial('#ffffff', 0.12);

  const downlights = useMemo(() => [...downlightPositions(layout), stockLightPosition(layout)], [layout]);

  const cove = useMemo<StripItem[]>(
    () => [
      { x: 1.2, y: H - 0.9, z: -L + 1.2, w: 0.7, h: 0.5, d: L - 2.4 },
      { x: W - 1.9, y: H - 0.9, z: -L + 1.2, w: 0.7, h: 0.5, d: L - 2.4 },
      { x: 1.2, y: H - 0.9, z: -L + 1.2, w: W - 2.4, h: 0.5, d: 0.7 },
      { x: 1.2, y: H - 0.9, z: -1.9, w: W - 2.4, h: 0.5, d: 0.7 },
    ],
    [W, L, H],
  );

  const xAisle = (layout.aisle.x0 + layout.aisle.x1) / 2;
  const linear = useMemo<StripItem[]>(
    () => [{ x: xAisle - 0.7, y: H - 0.5, z: -shopL * 0.92, w: 1.4, h: 0.4, d: shopL * 0.84 }],
    [xAisle, H, shopL],
  );

  if (mode === 'hidden') return null;
  const solid = mode === 'visible';

  return (
    <group>
      <Slab
        x={-4} y={H} z={-L - 4} w={W + 8} h={2} d={L + 8}
        material={solid ? slabMat : ghost}
        cast={solid}
        noRaycast
      />
      {solid && (
        <>
          {/* Recessed LED downlights */}
          {downlights.map((p, i) => (
            <group key={i} position={[p.x, H - 0.03, -p.y]}>
              <mesh geometry={ringGeo} material={trim} rotation={flatDown} raycast={() => null} />
              {lighting.downlights && (
                <mesh geometry={discGeo} material={led} rotation={flatDown} position={[0, -0.02, 0]} raycast={() => null} />
              )}
            </group>
          ))}
          {/* Decorative linear light + housing */}
          <Slab x={xAisle - 1.3} y={H - 0.35} z={-shopL * 0.93} w={2.6} h={0.35} d={shopL * 0.86} material={housing} cast={false} noRaycast />
          {lighting.cove && <Strips items={linear} material={led} />}
          {/* Concealed perimeter cove */}
          {lighting.cove && <Strips items={cove} material={led} />}
        </>
      )}
    </group>
  );
}
