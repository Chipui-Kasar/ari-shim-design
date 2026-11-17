'use client';

import { useMemo } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { MEDICINE_PLANS, MEDICINE_PRODUCTS, poolFor } from '@/lib/products';
import { fillShelf, hashString, mulberry32, type Placement } from '@/lib/shelfFill';
import { groupPlacements, rackGrid, type Frame } from '@/lib/grids';
import type { UnitLayout } from '@/lib/layout';
import { ProductInstances } from '@/components/scene/ProductInstances';

/** Medicine cartons, syrup bottles, tablet & capsule boxes, first aid, vitamins and devices. */
export function MedicineProducts() {
  const layout = usePharmacyStore((s) => s.layout);
  const med = usePharmacyStore((s) => s.config.medicine);
  const back = usePharmacyStore((s) => s.config.backCabinets);

  const sets = useMemo(() => {
    const out: Array<{ frame: Frame; placement: Placement }> = [];
    const units: Array<{ unit: UnitLayout; planKey: string; height: number; base?: number }> = [
      { unit: layout.rxRight, planKey: 'rxRight', height: med.rackHeight },
      { unit: layout.otcRight, planKey: 'otcRight', height: med.rackHeight },
      { unit: layout.rxGap, planKey: 'rxGap', height: med.rackHeight, base: layout.gapBase },
      { unit: layout.back, planKey: 'back', height: back.height },
    ];

    for (const { unit, planKey, height, base } of units) {
      const grid = rackGrid(unit.length, height, med.spacing, base);
      const plan = MEDICINE_PLANS[planKey];
      const frame: Frame = { position: unit.position, yaw: unit.yaw };

      grid.bays.forEach((bay, bi) => {
        grid.levels.forEach((lv) => {
          const cat = plan[lv.index % plan.length];
          const rng = mulberry32(hashString(`${unit.key}-${bi}-${lv.index}`));
          fillShelf({
            pool: poolFor([cat], MEDICINE_PRODUCTS),
            x0: bay.x0 + 0.9,
            x1: bay.x1 - 0.9,
            surface: lv.surface,
            clearance: lv.clearance,
            depth: unit.depth - 0.6,
            rng,
            unit: unit.id,
            frontMargin: 0.6,
            maxRows: 3,
          }).forEach((placement) => out.push({ frame, placement }));
        });
      });
    }
    return groupPlacements(out);
  }, [layout, med.rackHeight, med.spacing, back.height]);

  return <ProductInstances sets={sets} />;
}
