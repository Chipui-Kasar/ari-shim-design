'use client';

import { useMemo } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { getGlassMaterial, getPaintMaterial, getSurfaceMaterial } from '@/lib/materials';
import { COSMETIC_BOARD_T, cosmeticsGrid, glassBayIndices } from '@/lib/grids';
import { COSMETIC_BAY_SIGNS } from '@/lib/products';
import {
  Plate,
  Selectable,
  Slab,
  Strips,
  WashPlanes,
  useLedMaterials,
  type StripItem,
} from '@/components/scene/primitives';

/**
 * LEFT WALL – cosmetics display.
 * Natural-oak shelves in an aluminium frame, 12" closed plinth, glass premium bays,
 * warm LED strip under every shelf and slim category signage.
 * Local frame: x along the wall (0..length), z from the wall (-depth) to the front (0).
 */
export function CosmeticsShelves() {
  const cfg = usePharmacyStore((s) => s.config.cosmetics);
  const unit = usePharmacyStore((s) => s.layout.cosmetics);
  const lighting = usePharmacyStore((s) => s.config.lighting);
  const { led, wash } = useLedMaterials();

  const D = unit.depth;
  const len = unit.length;
  const T = COSMETIC_BOARD_T;

  const grid = useMemo(() => cosmeticsGrid(len, cfg), [len, cfg]);
  const glassBays = useMemo(() => glassBayIndices(grid.bays.length, cfg.glassSections), [grid.bays.length, cfg.glassSections]);

  const mats = useMemo(
    () => ({
      shelf: getSurfaceMaterial(cfg.material, { tint: cfg.tint }),
      face: getSurfaceMaterial(cfg.material, { tint: cfg.tint, vertical: true }),
      alu: getSurfaceMaterial('aluminium'),
      dark: getSurfaceMaterial('charcoal'),
      back: getPaintMaterial('#eeebe5', 0.8),
      glass: getGlassMaterial(),
    }),
    [cfg.material, cfg.tint],
  );

  const doors = Math.max(1, Math.round(len / 22));
  const plinthH = cfg.plinth;

  // --- LED strips (one under every shelf board + under the top cap) -------
  const { strips, washes } = useMemo(() => {
    const strips: StripItem[] = [];
    const washes: StripItem[] = [];
    grid.bays.forEach((bay) => {
      const bw = bay.x1 - bay.x0;
      grid.levels.forEach((lv, k) => {
        const under = k === 0 ? null : lv.surface - T - 0.3;
        if (under !== null) {
          strips.push({ x: bay.x0 + 1.2, y: under, z: -2.4, w: bw - 2.4, h: 0.3, d: 0.8 });
          const below = grid.levels[k - 1].clearance;
          const wh = Math.min(below * 0.92, 10);
          washes.push({ x: bay.x0 + 0.8, y: under - wh, z: -D + 0.56, w: bw - 1.6, h: wh, d: 1 });
        }
      });
      const topY = grid.zoneTop - 0.3;
      strips.push({ x: bay.x0 + 1.2, y: topY, z: -2.4, w: bw - 2.4, h: 0.3, d: 0.8 });
      const last = grid.levels[grid.levels.length - 1];
      if (last) {
        const wh = Math.min(last.clearance * 0.92, 10);
        washes.push({ x: bay.x0 + 0.8, y: topY - wh, z: -D + 0.56, w: bw - 1.6, h: wh, d: 1 });
      }
    });
    // Cove light on top of the run washing the wall above.
    strips.push({ x: 1, y: cfg.topHeight + 0.2, z: -D + 1.6, w: len - 2, h: 0.4, d: 0.6 });
    washes.push({ x: 0, y: cfg.topHeight + 0.5, z: -D + 0.08, w: len, h: 22, d: 1, flip: true });
    return { strips, washes };
  }, [grid, D, len, cfg.topHeight, T]);

  const signs = COSMETIC_BAY_SIGNS;

  return (
    <Selectable id="cosmetics" position={unit.position} rotation={[0, unit.yaw, 0]}>
      {/* Closed oak plinth cabinet (the "1 ft above the floor" base) */}
      <Slab x={0} y={0} z={-D + 1} w={len} h={2.5} d={D - 3} material={mats.dark} cast={false} />
      <Slab x={0} y={2.5} z={-D} w={len} h={plinthH - 2.5 - T} d={D} material={mats.face} />
      {Array.from({ length: doors - 1 }, (_, i) => (
        <Slab key={i} x={((i + 1) * len) / doors - 0.1} y={2.7} z={-0.12} w={0.2} h={plinthH - 3.2 - T} d={0.2} material={mats.dark} cast={false} />
      ))}

      {/* Back panel */}
      <Slab x={0} y={plinthH} z={-D} w={len} h={cfg.topHeight - plinthH} d={0.5} material={mats.back} />

      {/* Aluminium dividers (full-depth plates) */}
      {Array.from({ length: grid.bays.length + 1 }, (_, i) => {
        const x = i === 0 ? 0 : i === grid.bays.length ? len - 1.2 : grid.bays[i].x0 - 0.4;
        const end = i === 0 || i === grid.bays.length;
        // End panels are solid wood; dividers between bays are brushed aluminium.
        return <Slab key={i} x={x} y={plinthH} z={-D} w={end ? 1.2 : 0.8} h={cfg.topHeight - plinthH} d={D} material={end ? mats.face : mats.alu} />;
      })}

      {/* Shelf boards with aluminium front lips */}
      {grid.bays.map((bay, bi) =>
        grid.levels.map((lv) => (
          <group key={`${bi}-${lv.index}`}>
            <Slab x={bay.x0 + 0.4} y={lv.surface - T} z={-D + 0.5} w={bay.x1 - bay.x0 - 0.8} h={T} d={D - 0.9} material={mats.shelf} />
            <Slab x={bay.x0 + 0.4} y={lv.surface - T} z={-0.4} w={bay.x1 - bay.x0 - 0.8} h={T} d={0.4} material={mats.alu} />
          </group>
        )),
      )}

      {/* Top cap */}
      <Slab x={0} y={cfg.topHeight - T} z={-D} w={len} h={T} d={D} material={mats.shelf} />
      <Slab x={0} y={cfg.topHeight - T} z={-0.4} w={len} h={T} d={0.4} material={mats.alu} />

      {/* Glass premium bays */}
      {glassBays.map((bi) => {
        const bay = grid.bays[bi];
        const bw = bay.x1 - bay.x0;
        const h = cfg.topHeight - T - plinthH;
        return (
          <group key={`glass-${bi}`}>
            <Slab x={bay.x0 + 0.4} y={plinthH} z={-0.9} w={bw - 0.8} h={h} d={0.3} material={mats.glass} cast={false} noRaycast />
            <Slab x={bay.x0 + 0.4} y={plinthH} z={-1.1} w={bw - 0.8} h={0.9} d={0.7} material={mats.alu} />
            <Slab x={bay.x0 + 0.4} y={cfg.topHeight - T - 0.9} z={-1.1} w={bw - 0.8} h={0.9} d={0.7} material={mats.alu} />
            <mesh position={[bay.x0 + bw - 2, plinthH + h * 0.45, -0.5]} rotation={[Math.PI / 2, 0, 0]} material={mats.dark}>
              <cylinderGeometry args={[0.35, 0.35, 0.3, 14]} />
            </mesh>
          </group>
        );
      })}

      {/* Category signage above each bay */}
      {grid.bays.map((bay, i) => {
          const bw = bay.x1 - bay.x0;
          const sw = Math.min(bw - 4, 26);
          return (
            <group key={`sign-${i}`}>
              <Slab x={bay.x0 + (bw - sw) / 2 - 0.3} y={cfg.topHeight + 1.9} z={-D + 0.4} w={sw + 0.6} h={4} d={0.5} material={mats.alu} />
              <Plate
                text={signs[i % signs.length]}
                x={bay.x0 + (bw - sw) / 2} y={cfg.topHeight + 2.2} z={-D + 0.93}
                w={sw} h={3.4}
                bg="#7f9f7b" fg="#ffffff" align="center" icon
              />
            </group>
          );
      })}

      {lighting.shelfLeds && (
        <>
          <Strips items={strips} material={led} />
          <WashPlanes items={washes} material={wash} />
        </>
      )}
    </Selectable>
  );
}
