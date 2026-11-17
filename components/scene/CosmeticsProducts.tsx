'use client';

import { useMemo } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { COSMETIC_PRODUCTS, COSMETIC_BAY_PLAN, poolFor } from '@/lib/products';
import { fillShelf, hashString, mulberry32, type Placement } from '@/lib/shelfFill';
import { COSMETIC_BOARD_T, cosmeticsGrid, glassBayIndices, groupPlacements } from '@/lib/grids';
import { ProductInstances } from '@/components/scene/ProductInstances';

const PREMIUM_IDS = ['serum-c', 'serum-h', 'found', 'nail'];

/** Face wash, moisturiser, sunscreen, shampoo, conditioner, lotion, perfume, jars, hair & hygiene. */
export function CosmeticsProducts() {
  const cfg = usePharmacyStore((s) => s.config.cosmetics);
  const unit = usePharmacyStore((s) => s.layout.cosmetics);

  const sets = useMemo(() => {
    const grid = cosmeticsGrid(unit.length, cfg);
    const glass = glassBayIndices(grid.bays.length, cfg.glassSections);
    const frame = { position: unit.position, yaw: unit.yaw };
    const out: Array<{ frame: typeof frame; placement: Placement }> = [];

    grid.bays.forEach((bay, bi) => {
      const isGlass = glass.includes(bi);
      const cats = COSMETIC_BAY_PLAN[bi % COSMETIC_BAY_PLAN.length];
      const pool = isGlass
        ? COSMETIC_PRODUCTS.filter((p) => p.category === 'fragrance' || PREMIUM_IDS.includes(p.id))
        : poolFor(cats, COSMETIC_PRODUCTS);

      grid.levels.forEach((lv) => {
        const rng = mulberry32(hashString(`cos-${bi}-${lv.index}`));
        const placed = fillShelf({
          pool,
          x0: bay.x0 + 0.9,
          x1: bay.x1 - 0.9,
          surface: lv.surface,
          clearance: lv.clearance - (isGlass ? 0.2 : 0),
          depth: unit.depth - 0.6,
          rng,
          unit: 'cosmetics',
          frontMargin: isGlass ? 1.4 : 0.7,
          maxRows: isGlass ? 1 : 2,
        });
        placed.forEach((placement) => out.push({ frame, placement }));
      });
    });
    return groupPlacements(out);
  }, [cfg, unit]);

  return <ProductInstances sets={sets} />;
}

export { COSMETIC_BOARD_T };
