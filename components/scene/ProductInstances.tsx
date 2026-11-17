'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { ObjectId } from '@/types/pharmacy';
import { getProductParts, type ProductPart } from '@/lib/productGeometry';
import type { InstanceSet } from '@/lib/grids';
import { usePharmacyStore } from '@/store/pharmacyStore';

function Part({
  part,
  matrices,
  units,
}: {
  part: ProductPart;
  matrices: THREE.Matrix4[];
  units: ObjectId[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const st = usePharmacyStore.getState();
    if (st.view === 'walkthrough' || e.delta > 4) return;
    e.stopPropagation();
    const id = e.instanceId !== undefined ? units[e.instanceId] : undefined;
    if (id) st.select(id);
  };

  return (
    <instancedMesh
      key={matrices.length}
      ref={ref}
      args={[part.geometry, part.material, matrices.length]}
      frustumCulled={false}
      receiveShadow
      renderOrder={part.transparent ? 3 : 0}
      onClick={onClick}
    />
  );
}

/** Renders every product design as 1–3 InstancedMeshes (one draw call each). */
export function ProductInstances({ sets }: { sets: InstanceSet[] }) {
  const built = useMemo(
    () => sets.map((s) => ({ set: s, parts: getProductParts(s.spec) })),
    [sets],
  );
  return (
    <group>
      {built.map(({ set, parts }) =>
        parts.map((part) => (
          <Part key={part.id} part={part} matrices={set.matrices} units={set.units} />
        )),
      )}
    </group>
  );
}
