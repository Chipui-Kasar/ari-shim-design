'use client';

import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { ObjectId, WallMode } from '@/types/pharmacy';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { getPlateTexture, getWashTexture, type PlateStyle } from '@/lib/labelTexture';
import { kelvinToColor } from '@/lib/materials';

/* ------------------------------------------------------------------ */
/*  Box with real-world (inch) UVs                                     */
/* ------------------------------------------------------------------ */

const boxCache = new Map<string, THREE.BoxGeometry>();

/** BoxGeometry whose UVs are measured in inches so textures keep real scale. */
export function inchBox(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  const hit = boxCache.get(key);
  if (hit) return hit;
  const g = new THREE.BoxGeometry(w, h, d);
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    const x = pos.getX(i) + w / 2;
    const y = pos.getY(i) + h / 2;
    const z = pos.getZ(i) + d / 2;
    if (Math.abs(nor.getX(i)) > 0.5) uv.setXY(i, z, y);
    else if (Math.abs(nor.getY(i)) > 0.5) uv.setXY(i, x, z);
    else uv.setXY(i, x, y);
  }
  uv.needsUpdate = true;
  boxCache.set(key, g);
  return g;
}

export interface SlabProps {
  /** Minimum corner (inches) in the parent's frame. */
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  material: THREE.Material | THREE.Material[];
  cast?: boolean;
  receive?: boolean;
  noRaycast?: boolean;
}

/** An axis-aligned box addressed by its min corner and size. */
export function Slab({ x, y, z, w, h, d, material, cast = true, receive = true, noRaycast }: SlabProps) {
  const geometry = useMemo(() => inchBox(w, h, d), [w, h, d]);
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[x + w / 2, y + h / 2, z + d / 2]}
      castShadow={cast}
      receiveShadow={receive}
      raycast={noRaycast ? () => null : undefined}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  LED strips + light wash (instanced)                                */
/* ------------------------------------------------------------------ */

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitPlane = new THREE.PlaneGeometry(1, 1);

export interface StripItem {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  /** Rotate 180° about Z (flips a vertical gradient). Wash planes only. */
  flip?: boolean;
}

function useInstances(items: StripItem[], centered: boolean) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const qFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    items.forEach((it, i) => {
      p.set(centered ? it.x + it.w / 2 : it.x, centered ? it.y + it.h / 2 : it.y, centered ? it.z + it.d / 2 : it.z);
      s.set(it.w, it.h, it.d);
      m.compose(p, it.flip ? qFlip : q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [items, centered]);
  return ref;
}

export function Strips({ items, material }: { items: StripItem[]; material: THREE.Material }) {
  const ref = useInstances(items, true);
  if (items.length === 0) return null;
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[unitBox, material, items.length]}
      frustumCulled={false}
      raycast={() => null}
    />
  );
}

export function WashPlanes({ items, material }: { items: StripItem[]; material: THREE.Material }) {
  const ref = useInstances(items, true);
  if (items.length === 0) return null;
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[unitPlane, material, items.length]}
      frustumCulled={false}
      renderOrder={4}
      raycast={() => null}
    />
  );
}

/** Shared HDR LED + wash materials driven by the lighting settings. */
export function useLedMaterials() {
  const temperature = usePharmacyStore((s) => s.config.lighting.temperature);
  const intensity = usePharmacyStore((s) => s.config.lighting.intensity);
  return useMemo(() => {
    const c = kelvinToColor(temperature);
    const led = new THREE.MeshBasicMaterial({
      color: c.clone().multiplyScalar(2.2 * Math.max(0.35, intensity)),
      toneMapped: false,
    });
    const wash = new THREE.MeshBasicMaterial({
      map: getWashTexture(),
      color: c.clone(),
      transparent: true,
      opacity: 0.26 * Math.min(1.4, intensity),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    return { led, wash, color: c };
  }, [temperature, intensity]);
}

/* ------------------------------------------------------------------ */
/*  Selection wrapper                                                  */
/* ------------------------------------------------------------------ */

export function Selectable({
  id,
  children,
  position,
  rotation,
}: {
  id: ObjectId;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const select = usePharmacyStore((s) => s.select);
  const hover = usePharmacyStore((s) => s.hover);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (usePharmacyStore.getState().view === 'walkthrough') return;
    if (e.delta > 4) return; // was an orbit drag, not a click
    e.stopPropagation();
    select(id);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (usePharmacyStore.getState().view === 'walkthrough') return;
    e.stopPropagation();
    hover(id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    hover(null);
    document.body.style.cursor = '';
  };

  return (
    <group position={position} rotation={rotation} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Ghost / wall-mode helper                                           */
/* ------------------------------------------------------------------ */

const ghostCache = new Map<string, THREE.MeshStandardMaterial>();
export function getGhostMaterial(color: string, opacity = 0.12): THREE.MeshStandardMaterial {
  const key = `${color}:${opacity}`;
  let m = ghostCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.9, depthWrite: false });
    ghostCache.set(key, m);
  }
  return m;
}

export function isVisible(mode: WallMode): boolean {
  return mode !== 'hidden';
}

/* ------------------------------------------------------------------ */
/*  Flat text plate (signage / shelf category labels)                  */
/* ------------------------------------------------------------------ */

export interface PlateProps extends PlateStyle {
  text: string;
  /** Minimum corner + size, inches, in the parent's frame (plate faces +Z). */
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  glow?: number;
}

export function Plate({ text, x, y, z, w, h, glow = 0.14, ...style }: PlateProps) {
  const { bg, fg, align, ppi, weight, icon } = style;
  const material = useMemo(() => {
    const tex = getPlateTexture(text, w, h, { bg, fg, align, ppi, weight, icon });
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.55,
      emissiveMap: tex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: glow,
    });
  }, [text, w, h, bg, fg, align, ppi, weight, icon, glow]);
  return (
    <mesh position={[x + w / 2, y + h / 2, z]} material={material} raycast={() => null}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}
