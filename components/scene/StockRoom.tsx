'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { PARTITION_T, STOCK_JAMB, type Rect } from '@/lib/layout';
import { getPaintMaterial, getSurfaceMaterial } from '@/lib/materials';
import { hashString, mulberry32 } from '@/lib/shelfFill';
import { Plate, Selectable, Slab, getGhostMaterial } from '@/components/scene/primitives';

/** When open, the back-door leaf stands 90° flat against the bed side (left) of the doorway, so the way in stays clear. */
const LEAF_OPEN = Math.PI / 2;
const RAIL = 2.5; // screen-door frame width (inches)
const KICK = 9; // kick-plate height (inches)

/** Plan-space box (x, y-from-front) + heights -> Slab props (scene z = -plan y). */
function box(x0: number, x1: number, y0: number, y1: number, h0: number, h1: number) {
  return { x: x0, y: h0, z: -y1, w: x1 - x0, h: h1 - h0, d: y1 - y0 };
}

interface Carton {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  h0: number;
  h1: number;
  mat: number;
  face: '-y' | '-x';
}

/** Floor stacks of stock cartons filling a rect; the open face of each stack points at `face`. */
function cartonStacks(rect: Rect, face: '-y' | '-x', seed: string, matCount: number): Carton[] {
  const rng = mulberry32(hashString(seed));
  const alongX = rect.x1 - rect.x0 >= rect.y1 - rect.y0;
  const len = alongX ? rect.x1 - rect.x0 : rect.y1 - rect.y0;
  const n = Math.max(1, Math.floor(len / 16));
  const step = len / n;
  const out: Carton[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (alongX ? rect.x0 : rect.y0) + i * step + 0.3;
    const a1 = a0 + step - 0.6;
    const stackH = 2 + Math.floor(rng() * 3); // 2–4 cartons high
    let h = 0;
    for (let k = 0; k < stackH; k++) {
      const ch = 9 + rng() * 5;
      const jitter = (rng() - 0.5) * 0.8;
      out.push({
        x0: alongX ? a0 + jitter : rect.x0 + 0.3,
        x1: alongX ? a1 + jitter : rect.x1 - 0.3,
        y0: alongX ? rect.y0 + 0.3 : a0 + jitter,
        y1: alongX ? rect.y1 - 0.3 : a1 + jitter,
        h0: h,
        h1: h + ch,
        mat: Math.floor(rng() * matCount),
        face,
      });
      h += ch;
    }
  }
  return out;
}

/**
 * The stock & rest room behind the shop:
 *  • a 4" partition wall with a 2'-8" screen door at the RIGHT end of the back wall of the shop (closed by default)
 *  • stacks of stock cartons on the floor (no shelving)
 *  • a single rest bed, head against the left wall
 */
export function StockRoom() {
  const layout = usePharmacyStore((s) => s.layout);
  const mode = usePharmacyStore((s) => s.walls.partition);
  const open = usePharmacyStore((s) => s.stockDoorOpen);
  const wallColor = usePharmacyStore((s) => s.config.finishes.wallColor);
  const { W, H, L, shopL, stock } = layout;
  const T = PARTITION_T;
  const door = stock.door;

  const m = useMemo(
    () => ({
      wall: getPaintMaterial(wallColor),
      ghost: getGhostMaterial('#cfd6d4', 0.2),
      trim: getPaintMaterial('#f4f3ef', 0.5),
      leaf: getSurfaceMaterial('oakLight', { vertical: true }),
      alu: getSurfaceMaterial('aluminium'),
      oak: getSurfaceMaterial('oakNatural'),
      mattress: getPaintMaterial('#ecebe6'),
      blanket: getPaintMaterial('#a9bda3'),
      pillow: getPaintMaterial('#fbfbf8'),
      frosted: new THREE.MeshStandardMaterial({ color: '#e9f0ee', transparent: true, opacity: 0.86, roughness: 0.32, metalness: 0 }),
      cartons: [getPaintMaterial('#c9a574'), getPaintMaterial('#d8b988'), getPaintMaterial('#e6d3ae'), getPaintMaterial('#f2f0ea')],
      tape: getPaintMaterial('#efe6d0'),
      label: getPaintMaterial('#ffffff', 0.7),
      band: getPaintMaterial('#6f9a6a', 0.7),
    }),
    [wallColor],
  );

  const cartons = useMemo(
    () => stock.storage.flatMap((s, i) => cartonStacks(s.rect, s.face, `stock-${i}`, m.cartons.length)),
    [stock.storage, m.cartons.length],
  );

  const partMat = mode === 'ghost' ? m.ghost : m.wall;
  const solid = mode === 'visible';
  const ghost = mode === 'ghost';
  const py0 = stock.partition.y0;
  const py1 = stock.partition.y1;
  const leafW = door.width - 0.6;
  const leafH = door.height - 1;

  const bed = stock.bed;

  return (
    <Selectable id="stockRoom">
      {/* ---- Partition wall with the back-door opening ---- */}
      {mode !== 'hidden' && (
        <>
          <Slab {...box(0, door.x0, py0, py1, 0, H)} material={partMat} cast={solid} noRaycast={ghost} />
          <Slab {...box(door.x1, W, py0, py1, 0, H)} material={partMat} cast={solid} noRaycast={ghost} />
          <Slab {...box(door.x0, door.x1, py0, py1, door.height, H)} material={partMat} cast={solid} noRaycast={ghost} />

          {/* Door casing (architrave) proud of both faces */}
          <Slab {...box(door.x0 - STOCK_JAMB, door.x0, py0 - 0.5, py1 + 0.5, 0, door.height + STOCK_JAMB)} material={m.trim} cast={false} />
          <Slab {...box(door.x1, door.x1 + STOCK_JAMB, py0 - 0.5, py1 + 0.5, 0, door.height + STOCK_JAMB)} material={m.trim} cast={false} />
          <Slab {...box(door.x0 - STOCK_JAMB, door.x1 + STOCK_JAMB, py0 - 0.5, py1 + 0.5, door.height, door.height + STOCK_JAMB)} material={m.trim} cast={false} />

          {/* Screen door: aluminium frame, frosted panel, kick plate and lever handles.
              Hinged on the left jamb; closed it covers the opening, open it stands flat against the bed side. */}
          <group position={[door.x0 + 0.3, 0.5, -(py0 + T / 2)]} rotation={[0, open ? LEAF_OPEN : 0, 0]}>
            <LeafPart x0={0} x1={RAIL} y0={0} y1={leafH} t={1.8} mat={m.alu} />
            <LeafPart x0={leafW - RAIL} x1={leafW} y0={0} y1={leafH} t={1.8} mat={m.alu} />
            <LeafPart x0={RAIL} x1={leafW - RAIL} y0={leafH - RAIL} y1={leafH} t={1.8} mat={m.alu} />
            <LeafPart x0={RAIL} x1={leafW - RAIL} y0={0} y1={KICK} t={1.8} mat={m.alu} />
            {/* frosted screen panel */}
            <LeafPart x0={RAIL} x1={leafW - RAIL} y0={KICK} y1={leafH - RAIL} t={0.5} mat={m.frosted} cast={false} />
            {/* horizontal mid-rail */}
            <LeafPart x0={RAIL} x1={leafW - RAIL} y0={(leafH + KICK) / 2 - 0.6} y1={(leafH + KICK) / 2 + 0.6} t={1.2} mat={m.alu} />
            {/* lever handle + backplate, both faces */}
            {[-1, 1].map((side) => (
              <group key={side} position={[leafW - RAIL / 2, 36, side * 1.25]}>
                <mesh material={m.alu}>
                  <boxGeometry args={[1.2, 5, 0.25]} />
                </mesh>
                <mesh material={m.alu} position={[-1.4, 1.2, side * 0.45]}>
                  <boxGeometry args={[3, 0.6, 0.6]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Door sign on the shop side */}
          <Plate
            text="STOCK ROOM · STAFF ONLY"
            x={door.x0 - 1}
            y={door.height + 6}
            z={-py0 + 0.15}
            w={door.width + 2}
            h={5}
            bg="#1f3a33"
            fg="#ffffff"
            align="center"
            ppi={44}
            weight={700}
            glow={0.12}
          />
        </>
      )}

      {/* ---- Stock cartons stacked on the floor ---- */}
      {cartons.map((c, i) => {
        const lw = 7; // label width
        const lh = Math.min(4.5, (c.h1 - c.h0) * 0.45);
        const ly = c.h0 + (c.h1 - c.h0) * 0.5 - lh / 2;
        return (
          <group key={i}>
            <Slab {...box(c.x0, c.x1, c.y0, c.y1, c.h0, c.h1)} material={m.cartons[c.mat]} cast={false} />
            {/* packing tape across the top */}
            <Slab {...box(c.x0 + (c.x1 - c.x0) / 2 - 1, c.x0 + (c.x1 - c.x0) / 2 + 1, c.y0, c.y1, c.h1, c.h1 + 0.12)} material={m.tape} cast={false} noRaycast />
            {/* white label with a green band on the open face */}
            {c.face === '-y' ? (
              <>
                <Slab {...box(c.x0 + (c.x1 - c.x0 - lw) / 2, c.x0 + (c.x1 - c.x0 + lw) / 2, c.y0 - 0.08, c.y0, ly, ly + lh)} material={m.label} cast={false} noRaycast />
                <Slab {...box(c.x0 + (c.x1 - c.x0 - lw) / 2, c.x0 + (c.x1 - c.x0 + lw) / 2, c.y0 - 0.12, c.y0 - 0.08, ly + lh - 1, ly + lh)} material={m.band} cast={false} noRaycast />
              </>
            ) : (
              <>
                <Slab {...box(c.x0 - 0.08, c.x0, c.y0 + (c.y1 - c.y0 - lw) / 2, c.y0 + (c.y1 - c.y0 + lw) / 2, ly, ly + lh)} material={m.label} cast={false} noRaycast />
                <Slab {...box(c.x0 - 0.12, c.x0 - 0.08, c.y0 + (c.y1 - c.y0 - lw) / 2, c.y0 + (c.y1 - c.y0 + lw) / 2, ly + lh - 1, ly + lh)} material={m.band} cast={false} noRaycast />
              </>
            )}
          </group>
        );
      })}

      {/* ---- Rest bed (head against the left wall) ---- */}
      {bed && <Bed rect={bed} mats={m} />}
    </Selectable>
  );
}

/** One box of the screen-door leaf, addressed in the leaf's local frame (x from the hinge, y from the leaf's foot). */
function LeafPart({ x0, x1, y0, y1, t, mat, cast = true }: { x0: number; x1: number; y0: number; y1: number; t: number; mat: THREE.Material; cast?: boolean }) {
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} material={mat} castShadow={cast} receiveShadow>
      <boxGeometry args={[x1 - x0, y1 - y0, t]} />
    </mesh>
  );
}

function Bed({ rect, mats }: { rect: Rect; mats: { oak: THREE.Material; mattress: THREE.Material; blanket: THREE.Material; pillow: THREE.Material } }) {
  const { x0, x1, y0, y1 } = rect;
  return (
    <group>
      {/* frame / base */}
      <Slab {...box(x0, x1, y0, y1, 4, 14)} material={mats.oak} />
      {/* mattress */}
      <Slab {...box(x0 + 0.5, x1 - 0.5, y0 + 0.5, y1 - 0.5, 14, 20)} material={mats.mattress} />
      {/* blanket folded over the lower two thirds (foot end is the right-hand end) */}
      <Slab {...box(x0 + 20, x1 - 0.2, y0 + 0.1, y1 - 0.2, 14.4, 21)} material={mats.blanket} />
      {/* pillow */}
      <Slab {...box(x0 + 3, x0 + 17, y0 + 4, y1 - 4, 20, 24)} material={mats.pillow} />
      {/* headboard against the left wall */}
      <Slab {...box(x0, x0 + 1.6, y0, y1, 4, 32)} material={mats.oak} />
    </group>
  );
}
