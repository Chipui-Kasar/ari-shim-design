'use client';

import { useMemo } from 'react';
import type { Material } from 'three';
import type { MaterialId } from '@/types/pharmacy';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { RACK_BASE_HEIGHT, RACK_TOP_CLOSED, type UnitLayout } from '@/lib/layout';
import { getPaintMaterial, getSurfaceMaterial } from '@/lib/materials';
import { RACK_BOARD_T, rackGrid } from '@/lib/grids';
import { CATEGORY_LABEL, MEDICINE_PLANS } from '@/lib/products';
import {
  Plate,
  Selectable,
  Slab,
  Strips,
  WashPlanes,
  useLedMaterials,
  type StripItem,
} from '@/components/scene/primitives';

interface RackUnitProps {
  unit: UnitLayout;
  height: number;
  spacing: number;
  materialId: MaterialId;
  tint: string | null;
  /** key in MEDICINE_PLANS */
  planKey: string;
  ceilingH: number;
  /** Subtle LED lighting inside the cabinets. */
  leds: boolean;
  /** Surface height of the first shelf. Defaults to the 34" dispensing work-top. */
  baseH?: number;
  /** false = wall-hung unit (no lower cabinet / drawers). */
  lower?: boolean;
}

/** Closed door row with slim aluminium J-pulls. */
export function Doors({
  len, y0, y1, maxW = 20, pull, mat, alu,
}: {
  len: number; y0: number; y1: number; maxW?: number; pull: 'top' | 'bottom';
  mat: Material; alu: Material;
}) {
  const n = Math.max(1, Math.ceil(len / maxW));
  const dw = len / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <Slab x={i * dw + 0.15} y={y0} z={-0.45} w={dw - 0.3} h={y1 - y0} d={0.5} material={mat} />
          <Slab
            x={i * dw + 1.2} y={pull === 'top' ? y1 - 0.9 : y0 + 0.3} z={0.05}
            w={dw - 2.4} h={0.6} d={0.35} material={alu}
          />
        </group>
      ))}
    </>
  );
}

/** Row of lockable drawer fronts (key cylinder on each). */
export function Drawers({
  len, y0, y1, mat, alu, dark,
}: {
  len: number; y0: number; y1: number; mat: Material; alu: Material; dark: Material;
}) {
  const n = Math.max(1, Math.ceil(len / 18));
  const dw = len / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <group key={i}>
          <Slab x={i * dw + 0.15} y={y0} z={-0.45} w={dw - 0.3} h={y1 - y0} d={0.5} material={mat} />
          <Slab x={i * dw + 1.2} y={y1 - 0.9} z={0.05} w={dw - 2.4} h={0.6} d={0.35} material={alu} />
          <mesh position={[i * dw + dw / 2, y0 + (y1 - y0) * 0.38, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={dark}>
            <cylinderGeometry args={[0.32, 0.32, 0.18, 14]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/**
 * One run of white laminate medicine storage:
 *   closed lower cabinets + lockable drawers  ->  open shelves  ->  closed upper cabinets.
 * Local frame: x along the run, z from wall (-depth) to front (0).
 */
function RackUnit({ unit, height, spacing, materialId, tint, planKey, ceilingH, leds, baseH: baseProp, lower = true }: RackUnitProps) {
  const { led, wash } = useLedMaterials();
  const D = unit.depth;
  const len = unit.length;
  const T = RACK_BOARD_T;
  const baseH = baseProp ?? RACK_BASE_HEIGHT;

  const grid = useMemo(() => rackGrid(len, height, spacing, baseH), [len, height, spacing, baseH]);
  const plan = MEDICINE_PLANS[planKey];

  const mats = useMemo(
    () => ({
      body: getSurfaceMaterial(materialId, { tint, vertical: true }),
      board: getSurfaceMaterial(materialId, { tint }),
      alu: getSurfaceMaterial('aluminium'),
      dark: getSurfaceMaterial('charcoal'),
      back: getPaintMaterial('#f1f0ec', 0.75),
      top: getPaintMaterial('#f7f6f3', 0.45),
    }),
    [materialId, tint],
  );

  const { strips, washes } = useMemo(() => {
    const strips: StripItem[] = [];
    const washes: StripItem[] = [];
    grid.bays.forEach((bay) => {
      const bw = bay.x1 - bay.x0;
      grid.levels.forEach((lv, k) => {
        if (k === 0) return;
        const y = lv.surface - T - 0.3;
        strips.push({ x: bay.x0 + 1.2, y, z: -1.6, w: bw - 2.4, h: 0.3, d: 0.6 });
        const wh = Math.min(grid.levels[k - 1].clearance * 0.9, 9);
        washes.push({ x: bay.x0 + 0.8, y: y - wh, z: -D + 0.56, w: bw - 1.6, h: wh, d: 1 });
      });
      const last = grid.levels[grid.levels.length - 1];
      const y = grid.zoneTop - 0.3;
      strips.push({ x: bay.x0 + 1.2, y, z: -1.6, w: bw - 2.4, h: 0.3, d: 0.6 });
      if (last) {
        const wh = Math.min(last.clearance * 0.9, 9);
        washes.push({ x: bay.x0 + 0.8, y: y - wh, z: -D + 0.56, w: bw - 1.6, h: wh, d: 1 });
      }
    });
    // Cove light on top of the run
    strips.push({ x: 1, y: height + 0.2, z: -D + 1.2, w: len - 2, h: 0.4, d: 0.5 });
    const room = Math.max(4, Math.min(16, ceilingH - height - 1));
    washes.push({ x: 0, y: height + 0.5, z: -D + 0.08, w: len, h: room, d: 1, flip: true });
    return { strips, washes };
  }, [grid, D, len, height, ceilingH, T]);

  const zoneH = grid.zoneTop - baseH;

  return (
    <Selectable id={unit.id} position={unit.position} rotation={[0, unit.yaw, 0]}>
      {/* ---- closed lower cabinet (omitted on wall-hung units) ---- */}
      {lower && (
        <>
          <Slab x={0} y={0} z={-D + 1} w={len} h={3} d={D - 2.2} material={mats.dark} cast={false} />
          <Slab x={0} y={3} z={-D} w={len} h={baseH - 4} d={D} material={mats.body} />
          <Doors len={len} y0={3.2} y1={22} mat={mats.body} alu={mats.alu} pull="top" />
          <Drawers len={len} y0={22.4} y1={baseH - 1.2} mat={mats.body} alu={mats.alu} dark={mats.dark} />
        </>
      )}
      {/* dispensing work-top / first shelf */}
      <Slab x={0} y={baseH - 1} z={-D} w={len} h={1} d={D + 0.4} material={mats.top} />

      {/* ---- open shelving ---- */}
      <Slab x={0} y={baseH} z={-D} w={len} h={zoneH} d={0.5} material={mats.back} />
      {Array.from({ length: grid.bays.length + 1 }, (_, i) => {
        const x = i === 0 ? 0 : i === grid.bays.length ? len - 0.8 : grid.bays[i].x0 - 0.4;
        return <Slab key={i} x={x} y={baseH} z={-D} w={0.8} h={zoneH} d={D} material={mats.board} />;
      })}
      {grid.bays.map((bay, bi) =>
        grid.levels
          .filter((lv) => lv.index > 0)
          .map((lv) => (
            <group key={`${bi}-${lv.index}`}>
              <Slab x={bay.x0 + 0.4} y={lv.surface - T} z={-D + 0.5} w={bay.x1 - bay.x0 - 0.8} h={T} d={D - 0.9} material={mats.board} />
              <Slab x={bay.x0 + 0.4} y={lv.surface - T} z={-0.4} w={bay.x1 - bay.x0 - 0.8} h={T} d={0.4} material={mats.alu} />
            </group>
          )),
      )}

      {/* Category label plates on every shelf edge */}
      {grid.levels.map((lv) => {
        const cat = plan[lv.index % plan.length];
        const bw = grid.bays[0].x1 - grid.bays[0].x0;
        return (
          <Plate
            key={`plate-${lv.index}`}
            text={CATEGORY_LABEL[cat]}
            x={1.2} y={lv.surface - T + 0.06} z={0.08}
            w={Math.min(bw - 2.4, 19)} h={0.68}
            bg="#e4ece1" fg="#3b5a3a" align="left" ppi={60} weight={700} glow={0.1}
          />
        );
      })}

      {/* ---- closed upper cabinet ---- */}
      <Slab x={0} y={grid.zoneTop} z={-D} w={len} h={RACK_TOP_CLOSED} d={D} material={mats.body} />
      <Doors len={len} y0={grid.zoneTop + 0.2} y1={height - 0.2} mat={mats.body} alu={mats.alu} pull="bottom" />

      {leds && (
        <>
          <Strips items={strips} material={led} />
          <WashPlanes items={washes} material={wash} />
        </>
      )}
    </Selectable>
  );
}

/** Right-wall Rx + OTC racks, the pocket's front-wall rack, and the back-wall stock cabinets. */
export function MedicineShelves() {
  const layout = usePharmacyStore((s) => s.layout);
  const med = usePharmacyStore((s) => s.config.medicine);
  const back = usePharmacyStore((s) => s.config.backCabinets);
  const leds = usePharmacyStore((s) => s.config.lighting.shelfLeds);

  const common = { materialId: med.material, tint: med.tint, ceilingH: layout.H, leds, height: med.rackHeight, spacing: med.spacing };
  return (
    <group>
      <RackUnit unit={layout.rxRight} planKey="rxRight" {...common} />
      <RackUnit unit={layout.otcRight} planKey="otcRight" {...common} />
      <RackUnit unit={layout.rxGap} planKey="rxGap" {...common} baseH={layout.gapBase} lower={false} />
      <RackUnit
        unit={layout.back}
        planKey="back"
        materialId={back.material}
        tint={back.tint}
        ceilingH={layout.H}
        leds={leds}
        height={back.height}
        spacing={med.spacing}
      />
    </group>
  );
}
