'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { getFloorMaterial, getPaintMaterial } from '@/lib/materials';
import { Slab } from '@/components/scene/primitives';

/** Porcelain tile floor with real 24" joints + the pavement outside. */
export function Floor() {
  const { W, L } = usePharmacyStore((s) => s.layout);
  const floorColor = usePharmacyStore((s) => s.config.finishes.floorColor);
  const tileSize = usePharmacyStore((s) => s.config.finishes.tileSize);

  const mats = useMemo(() => {
    const top = getFloorMaterial(floorColor, tileSize);
    const edge = getPaintMaterial('#bdbbb5');
    // +x, -x, +y(top), -y, +z, -z
    return [edge, edge, top, edge, edge, edge];
  }, [floorColor, tileSize]);

  const ground = useMemo(() => getPaintMaterial('#cdd0cd', 0.95), []);

  return (
    <group>
      <Slab x={0} y={-2} z={-L} w={W} h={2} d={L} material={mats} cast={false} noRaycast />
      {/* Pavement / ground outside the shop */}
      <mesh position={[W / 2, -2.2, -L / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[3000, 3000]} />
        <primitive object={ground as THREE.Material} attach="material" />
      </mesh>
    </group>
  );
}
