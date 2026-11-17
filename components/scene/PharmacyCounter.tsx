'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { getCounterTopMaterial, getPaintMaterial, getSurfaceMaterial } from '@/lib/materials';
import { getSignboardTexture } from '@/lib/labelTexture';
import { Selectable, Slab, Strips, useLedMaterials, type StripItem } from '@/components/scene/primitives';
import { Doors, Drawers } from '@/components/scene/MedicineShelves';
import { Workstation } from '@/components/scene/Workstation';

interface OutlineParams {
  x0: number; // left-most x of the L
  W: number;
  Ls: number;
  Cd: number;
  /** inset of the outer (customer-facing) edges; negative = overhang */
  so: number;
  /** inset of the inner (pocket-facing) edges */
  si: number;
  r: number;
}

/**
 * The L in PLAN space (x, y-from-front), counter-clockwise, outer corner filleted.
 * Wall-side edges (right wall, and the end against the back rack) keep a 0.3" shadow gap.
 */
function outlinePoints(p: OutlineParams): THREE.Vector2[] {
  const q = p.Ls - p.Cd;
  const xL = p.x0 + p.so;
  const yB = p.Ls - p.so;
  const xi = p.x0 + p.Cd - p.si;
  const yi = q + p.si;
  const xR = p.W - 0.3;
  const yF = 0.3;
  const r = Math.max(0.2, p.r - p.so);
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(xL, yF),
    new THREE.Vector2(xi, yF),
    new THREE.Vector2(xi, yi),
    new THREE.Vector2(xR, yi),
    new THREE.Vector2(xR, yB),
    new THREE.Vector2(xL + r, yB),
  ];
  const seg = 12;
  for (let i = 1; i <= seg; i++) {
    const a = Math.PI / 2 + (i / seg) * (Math.PI / 2);
    pts.push(new THREE.Vector2(xL + r + Math.cos(a) * r, yB - r + Math.sin(a) * r));
  }
  // Mirror along the length: the rounded corner faces the open FRONT (y = 0) and the
  // short leg runs across the front. Reversing keeps the winding counter-clockwise.
  return pts.map((v) => new THREE.Vector2(v.x, p.Ls - v.y)).reverse();
}

/** Plan-space shape -> scene geometry (x, y-from-front) -> (X, Z = -y); extruded UP by `height`. */
function extrudeL(shape: THREE.Shape, height: number, y0: number, bevel = 0): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: height - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 12,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + bevel, 0);
  return g;
}

function shapeOf(pts: THREE.Vector2[], hole?: THREE.Vector2[]): THREE.Shape {
  const s = new THREE.Shape(pts);
  if (hole) s.holes.push(new THREE.Path([...hole].reverse()));
  return s;
}

/**
 * RIGHT-FRONT CORNER – the L-shaped dispensing & billing counter, standing at the OPEN FRONT
 * with its rounded corner facing the street. Oak front (fluted on the front leg), white solid-surface top, rounded outer corner,
 * LED toe-kick glow, lockable drawers + under-counter storage on the pharmacist side,
 * a sage-green branding panel, and a full computer / POS workstation.
 */
export function PharmacyCounter() {
  const layout = usePharmacyStore((s) => s.layout);
  const cfg = usePharmacyStore((s) => s.config.counter);
  const lighting = usePharmacyStore((s) => s.config.lighting);
  const { led } = useLedMaterials();

  const { W } = layout;
  const { x0, depth: Cd, sideLength: Ls } = layout.counter;
  const h = cfg.height;
  const pw = x0 + Cd; // x of the pocket-facing side-leg face

  const geos = useMemo(() => {
    const base: Omit<OutlineParams, 'so' | 'si' | 'r'> = { x0, W, Ls, Cd };
    const R = 9;
    const toe = extrudeL(shapeOf(outlinePoints({ ...base, so: 3.2, si: 2.6, r: R })), 3.4, 0);
    const bodyH = h - 1.4 - 3.6;
    const body = extrudeL(shapeOf(outlinePoints({ ...base, so: 0.3, si: 0, r: R })), bodyH, 3.6);
    const top = extrudeL(shapeOf(outlinePoints({ ...base, so: -0.7, si: -0.5, r: R })), 1.4, h - 1.4, 0.18);
    const ring = extrudeL(
      shapeOf(outlinePoints({ ...base, so: 0.9, si: 0.9, r: R }), outlinePoints({ ...base, so: 1.7, si: 1.7, r: R })),
      0.3,
      3.3,
    );
    return { toe, body, top, ring };
  }, [x0, W, Ls, Cd, h]);

  const mats = useMemo(
    () => ({
      body: getSurfaceMaterial(cfg.material, { tint: cfg.tint, vertical: true }),
      flute: getSurfaceMaterial(cfg.material, { tint: cfg.tint, vertical: true }),
      top: getCounterTopMaterial(),
      dark: getSurfaceMaterial('charcoal'),
      alu: getSurfaceMaterial('aluminium'),
      white: getPaintMaterial('#f3f2ee', 0.5),
      mat: getPaintMaterial('#30343a', 0.9),
    }),
    [cfg.material, cfg.tint],
  );

  // Fluted oak slats on the customer-facing front leg.
  const slats = useMemo<StripItem[]>(() => {
    const items: StripItem[] = [];
    const R = 9;
    const xs = x0 + R + 1.5;
    const xe = W - 1.2;
    // The curved corner is at the front, so the fluted front leg faces the street (+Z).
    for (let x = xs; x + 1 <= xe; x += 1.5) {
      items.push({ x, y: 4.0, z: -0.3, w: 1.0, h: h - 1.4 - 4.0, d: 0.7 });
    }
    return items;
  }, [x0, W, Ls, h]);

  // Soft glow under the counter (toe-kick LED ring reflected on the floor).
  const brand = useMemo(() => getSignboardTexture(26, 10.5), []);
  const brandMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: brand, roughness: 0.5, emissive: '#ffffff', emissiveMap: brand, emissiveIntensity: 0.9 }),
    [brand],
  );

  const flatMid = (x0 + 9 + 1.5 + W) / 2;
  const pocketW = layout.pocket.x1 - layout.pocket.x0;
  const pocketD = layout.pocket.y1 - layout.pocket.y0;

  return (
    <group>
      <Selectable id="counter">
        <mesh geometry={geos.toe} material={mats.dark} castShadow receiveShadow />
        <mesh geometry={geos.body} material={mats.body} castShadow receiveShadow />
        <mesh geometry={geos.top} material={mats.top} castShadow receiveShadow />
        {lighting.counterLight && <mesh geometry={geos.ring} material={led} raycast={() => null} />}

        {/* Fluted front leg */}
        <Strips items={slats} material={mats.flute} />
        {/* Branding panel on the front leg */}
        <Slab x={flatMid - 13.4} y={13.6} z={0.4} w={26.8} h={11.3} d={0.45} material={mats.alu} />
        <mesh position={[flatMid, 19.25, 0.9]} material={brandMat} raycast={() => null}>
          <planeGeometry args={[26, 10.5]} />
        </mesh>

        {/* Side leg: vertical aluminium reveals on the customer face */}
        {Array.from({ length: Math.max(0, Math.floor((Ls - Cd - 12) / 28)) }, (_, i) => (
          <Slab key={i} x={x0 + 0.1} y={4} z={-(Cd + 8 + i * 28) - 0.2} w={0.25} h={h - 5.4} d={0.4} material={mats.dark} cast={false} />
        ))}

        {/* Pharmacist side – lockable drawers + under-counter storage */}
        <group position={[pw, 0, -(Cd + 0.4)]} rotation={[0, Math.PI / 2, 0]}>
          <Doors len={pocketD - 0.8} y0={4} y1={22} mat={mats.white} alu={mats.alu} pull="top" maxW={22} />
          <Drawers len={pocketD - 0.8} y0={22.4} y1={h - 1.8} mat={mats.white} alu={mats.alu} dark={mats.dark} />
        </group>
        <group position={[layout.pocket.x1, 0, -Cd]} rotation={[0, Math.PI, 0]}>
          <Doors len={pocketW} y0={4} y1={22} mat={mats.white} alu={mats.alu} pull="top" maxW={22} />
          <Drawers len={pocketW} y0={22.4} y1={h - 1.8} mat={mats.white} alu={mats.alu} dark={mats.dark} />
        </group>
      </Selectable>

      {/* Anti-fatigue mat in the pharmacist pocket */}
      <Slab
        x={layout.pocket.x0 + 1.5} y={0} z={-(layout.pocket.y1 - 1.5)}
        w={layout.pocket.x1 - layout.pocket.x0 - 3} h={0.5} d={layout.pocket.y1 - layout.pocket.y0 - 3}
        material={mats.mat} cast={false} noRaycast
      />

      <Workstation layout={layout} counterHeight={h} />
    </group>
  );
}

