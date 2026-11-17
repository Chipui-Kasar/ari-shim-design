'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { WALL_THICKNESS } from '@/lib/layout';
import { getFrameMaterial, getPaintMaterial, getSurfaceMaterial } from '@/lib/materials';
import { getSignboardTexture } from '@/lib/labelTexture';
import { Selectable, Slab, getGhostMaterial } from '@/components/scene/primitives';

const SLAT = 2.4; // roller-shutter slat pitch (inches)
const BAR_H = 3; // bottom bar height

/** Corrugated slat profile: highlight / body / shadow line, repeating every SLAT inches. */
function makeSlatTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#f2f4f5');
  g.addColorStop(0.18, '#d9dde0');
  g.addColorStop(0.78, '#c3c8cc');
  g.addColorStop(0.9, '#8d949a');
  g.addColorStop(1, '#6f767c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

const unit = new THREE.BoxGeometry(1, 1, 1);

/**
 * OPEN SHOPFRONT closed by a ROLLER SHUTTER – there is no door and no front wall.
 *  • a fascia beam across the top carries the back-lit signboard and hides the roller box
 *  • the shutter curtain is PUSHED UP into the fascia (open) or PULLED DOWN to the threshold (closed),
 *    running in aluminium guide rails with a heavy bottom bar and lock
 */
export function Entrance() {
  const mode = usePharmacyStore((s) => s.walls.front);
  const layout = usePharmacyStore((s) => s.layout);
  const wallColor = usePharmacyStore((s) => s.config.finishes.wallColor);
  const frameId = usePharmacyStore((s) => s.config.door.frame);
  const T = WALL_THICKNESS;
  const { W, H, door } = layout;
  const openH = door.height; // clear opening height = shutter travel
  const fasciaH = H - openH;

  const frame = getFrameMaterial(frameId);
  const steel = useMemo(() => getFrameMaterial('aluminium'), []);
  const dark = useMemo(() => getSurfaceMaterial('charcoal'), []);

  const fasciaMats = useMemo(() => {
    const inside = getPaintMaterial(wallColor);
    const outside = getPaintMaterial('#ecebe6');
    // +x, -x, +y, -y, +z (street side), -z (shop side)
    return [outside, outside, outside, outside, outside, inside];
  }, [wallColor]);
  const ghostWall = getGhostMaterial('#cfd6d4', 0.2);

  const signW = Math.min(W - 10, 88);
  const signH = Math.max(6, Math.min(17, fasciaH - 3));
  const signTex = useMemo(() => getSignboardTexture(signW, 17), [signW]);
  const signMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.5, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 1.1 }),
    [signTex],
  );

  /* ---- shutter animation: amount 1 = fully pushed up (open), 0 = pulled down (closed) ---- */
  const slatTex = useMemo(() => makeSlatTexture(), []);
  const curtainMat = useMemo(() => new THREE.MeshStandardMaterial({ map: slatTex, roughness: 0.5, metalness: 0.55 }), [slatTex]);
  const curtain = useRef<THREE.Mesh>(null);
  const bar = useRef<THREE.Group>(null);
  const amount = useRef(1);

  useFrame((_, dt) => {
    const open = usePharmacyStore.getState().doorOpen;
    amount.current = THREE.MathUtils.damp(amount.current, open ? 1 : 0, 3.2, dt);
    const travel = openH * (1 - amount.current); // how far the shutter has been pulled down
    const showing = travel > BAR_H + 0.5;
    if (curtain.current) {
      curtain.current.visible = showing;
      if (showing) {
        const h = travel - BAR_H;
        curtain.current.scale.set(W - 3.2, h, 0.7);
        curtain.current.position.set(W / 2, openH - h / 2, T / 2);
        slatTex.repeat.set(1, h / SLAT);
      }
    }
    if (bar.current) {
      bar.current.visible = travel > 0.6;
      bar.current.position.y = openH - travel;
    }
  });

  if (mode === 'hidden') return null;
  const ghost = mode === 'ghost';

  return (
    <group>
      <Selectable id="door">
        {/* Fascia beam + sign (hides the roller box) */}
        <Slab
          x={0} y={openH} z={0} w={W} h={fasciaH} d={T}
          material={ghost ? ghostWall : fasciaMats}
          cast={!ghost}
          noRaycast={ghost}
        />
        {/* Shutter-box soffit */}
        <Slab x={0} y={openH - 0.7} z={0.4} w={W} h={0.7} d={T - 0.8} material={dark} cast={false} noRaycast />
        {!ghost && (
          <mesh position={[W / 2, openH + fasciaH / 2, T + 0.12]} material={signMat} raycast={() => null}>
            <planeGeometry args={[signW, signH]} />
          </mesh>
        )}

        {/* Guide rails */}
        <Slab x={0} y={0} z={0.5} w={1.6} h={openH} d={T - 1} material={frame} />
        <Slab x={W - 1.6} y={0} z={0.5} w={1.6} h={openH} d={T - 1} material={frame} />

        {/* Threshold channel the bottom bar locks into */}
        <Slab x={0} y={0} z={0.6} w={W} h={0.5} d={T - 1.2} material={steel} cast={false} noRaycast />

        {/* The slatted curtain */}
        <mesh ref={curtain} geometry={unit} material={curtainMat} castShadow receiveShadow />

        {/* Heavy bottom bar with lock + handle; travels with the curtain */}
        <group ref={bar}>
          <mesh position={[W / 2, BAR_H / 2, T / 2]} castShadow material={frame}>
            <boxGeometry args={[W - 3.2, BAR_H, 1.7]} />
          </mesh>
          <mesh position={[W / 2, 1.5, T / 2 + 0.9]} material={dark}>
            <boxGeometry args={[7, 1.1, 0.25]} />
          </mesh>
          {[W * 0.18, W * 0.82].map((x) => (
            <mesh key={x} position={[x, 1.5, T / 2 + 0.95]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
              <cylinderGeometry args={[0.9, 0.9, 0.3, 18]} />
            </mesh>
          ))}
        </group>
      </Selectable>
    </group>
  );
}
