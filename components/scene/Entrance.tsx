'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { WALL_THICKNESS } from '@/lib/layout';
import { getFrameMaterial, getGlassMaterial, getPaintMaterial } from '@/lib/materials';
import { getSignboardTexture } from '@/lib/labelTexture';
import { Selectable, Slab, getGhostMaterial } from '@/components/scene/primitives';

/** How far the glass door swings when fully open (degrees). */
const FULL_OPEN = 165;

/**
 * OPEN SHOPFRONT – there is no front wall. The whole width is open so the counter
 * table at the right-front corner serves straight onto the street. What remains:
 *  • a slim fascia beam across the top carrying the pharmacy sign
 *  • an aluminium threshold
 *  • the aluminium-framed tempered-glass entrance door, swung FULLY open (it folds
 *    back flat against the outside of the left wall, clear of the fixtures)
 */
export function Entrance() {
  const mode = usePharmacyStore((s) => s.walls.front);
  const layout = usePharmacyStore((s) => s.layout);
  const wallColor = usePharmacyStore((s) => s.config.finishes.wallColor);
  const frameId = usePharmacyStore((s) => s.config.door.frame);
  const T = WALL_THICKNESS;
  const { W, H, door } = layout;
  const dW = door.width;
  const dH = door.height;

  const frame = getFrameMaterial(frameId);
  const steel = useMemo(() => getFrameMaterial('aluminium'), []);
  const glassMat = getGlassMaterial();

  const fasciaH = 22;
  const fasciaMats = useMemo(() => {
    const inside = getPaintMaterial(wallColor);
    const outside = getPaintMaterial('#ecebe6');
    // +x, -x, +y, -y, +z (street side), -z (shop side)
    return [outside, outside, outside, outside, outside, inside];
  }, [wallColor]);
  const ghostWall = getGhostMaterial('#cfd6d4', 0.2);

  const signW = Math.min(W - 10, 88);
  const signH = 17;
  const signTex = useMemo(() => getSignboardTexture(signW, signH), [signW]);
  const signMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 1.25 }),
    [signTex],
  );

  /* ---- door swing ---- */
  const leaf = useRef<THREE.Group>(null);
  const angle = useRef(THREE.MathUtils.degToRad(FULL_OPEN));
  const camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    const st = usePharmacyStore.getState();
    let open = st.doorOpen;
    if (st.view === 'walkthrough') {
      const cx = door.x0 + dW / 2;
      open = open || (Math.hypot(camera.position.x - cx, camera.position.z) < 105 && camera.position.y < 100);
    }
    const target = open ? THREE.MathUtils.degToRad(FULL_OPEN) : 0;
    angle.current = THREE.MathUtils.damp(angle.current, target, 4.5, dt);
    if (leaf.current) leaf.current.rotation.y = -angle.current;
  });

  if (mode === 'hidden') return null;
  const ghost = mode === 'ghost';

  const stile = 2.3;
  const rail = 2.5;
  const kick = 9;

  return (
    <group>
      {/* Fascia beam + sign */}
      <Slab
        x={0} y={H - fasciaH} z={0} w={W} h={fasciaH} d={T}
        material={ghost ? ghostWall : fasciaMats}
        cast={!ghost}
        noRaycast={ghost}
      />
      <Slab x={0} y={H - fasciaH - 0.7} z={0} w={W} h={0.7} d={T} material={steel} cast={false} noRaycast />
      {!ghost && (
        <mesh position={[W / 2, H - fasciaH / 2, T + 0.12]} material={signMat} raycast={() => null}>
          <planeGeometry args={[signW, signH]} />
        </mesh>
      )}

      {/* Threshold across the whole opening */}
      <Slab x={0} y={0} z={0} w={W} h={0.4} d={T} material={steel} cast={false} noRaycast />

      {/* THE DOOR – hinged at the left of the aisle, swung fully open */}
      <Selectable id="door" position={[door.x0, 0, T + 1]}>
        <group ref={leaf}>
          <Slab x={0} y={0.5} z={-1} w={stile} h={dH - 0.5} d={2} material={frame} />
          <Slab x={dW - stile} y={0.5} z={-1} w={stile} h={dH - 0.5} d={2} material={frame} />
          <Slab x={stile} y={dH - rail} z={-1} w={dW - 2 * stile} h={rail} d={2} material={frame} />
          <Slab x={stile} y={0.5} z={-1} w={dW - 2 * stile} h={kick} d={2} material={frame} />
          <Slab
            x={stile} y={0.5 + kick} z={-0.2}
            w={dW - 2 * stile} h={dH - rail - kick - 0.5} d={0.4}
            material={glassMat} cast={false}
          />
          {/* Vertical pull bars (both faces) */}
          {[1.9, -1.9].map((z) => (
            <mesh key={z} position={[dW - 5, 40, z]} material={steel} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 28, 16]} />
            </mesh>
          ))}
          {[32, 48].flatMap((y) =>
            [1.2, -1.2].map((z) => (
              <mesh key={`${y}${z}`} position={[dW - 5, y, z]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
                <cylinderGeometry args={[0.35, 0.35, 1.2, 10]} />
              </mesh>
            )),
          )}
          {/* Hinge pins */}
          {[8, dH - 8].map((y) => (
            <mesh key={y} position={[0.4, y, 0]} material={steel}>
              <cylinderGeometry args={[0.6, 0.6, 4, 12]} />
            </mesh>
          ))}
        </group>
      </Selectable>
    </group>
  );
}
