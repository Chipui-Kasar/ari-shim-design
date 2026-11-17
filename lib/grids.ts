import * as THREE from 'three';
import type { CosmeticsConfig } from '@/types/pharmacy';
import { RACK_BASE_HEIGHT, RACK_TOP_CLOSED } from '@/lib/layout';
import { computeShelfGrid, type ShelfGrid } from '@/lib/shelfGrid';
import type { Placement } from '@/lib/shelfFill';
import type { ProductSpec } from '@/lib/products';

export const COSMETIC_BOARD_T = 0.9;
export const RACK_BOARD_T = 0.8;

export function cosmeticsGrid(length: number, cfg: CosmeticsConfig): ShelfGrid {
  return computeShelfGrid({
    length,
    bayTarget: 33,
    yStart: cfg.plinth,
    zoneTop: cfg.topHeight - COSMETIC_BOARD_T,
    spacing: cfg.spacing,
    boardT: COSMETIC_BOARD_T,
  });
}

export function rackGrid(length: number, height: number, spacing: number, base: number = RACK_BASE_HEIGHT): ShelfGrid {
  return computeShelfGrid({
    length,
    bayTarget: 30,
    yStart: base,
    zoneTop: height - RACK_TOP_CLOSED,
    spacing,
    boardT: RACK_BOARD_T,
  });
}

/** Which bays of the cosmetics run are glass-fronted premium cabinets. */
export function glassBayIndices(bayCount: number, count: number): number[] {
  const order = [bayCount - 1, 1, bayCount - 2, 0].filter((v, i, a) => v >= 0 && v < bayCount && a.indexOf(v) === i);
  return order.slice(0, Math.min(count, bayCount));
}

/* ------------------------------------------------------------------ */
/*  Unit-local placement -> world matrix                               */
/* ------------------------------------------------------------------ */

export interface Frame {
  position: [number, number, number];
  yaw: number;
}

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);
const _axis = new THREE.Vector3(0, 1, 0);

export function placementMatrix(frame: Frame, p: Placement): THREE.Matrix4 {
  const c = Math.cos(frame.yaw);
  const s = Math.sin(frame.yaw);
  _p.set(frame.position[0] + p.x * c + p.z * s, frame.position[1] + p.y, frame.position[2] - p.x * s + p.z * c);
  _q.setFromAxisAngle(_axis, frame.yaw + p.yaw);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

export interface InstanceSet {
  spec: ProductSpec;
  matrices: THREE.Matrix4[];
  units: Placement['unit'][];
}

export function groupPlacements(list: Array<{ frame: Frame; placement: Placement }>): InstanceSet[] {
  const map = new Map<string, InstanceSet>();
  for (const { frame, placement } of list) {
    let set = map.get(placement.spec.id);
    if (!set) {
      set = { spec: placement.spec, matrices: [], units: [] };
      map.set(placement.spec.id, set);
    }
    set.matrices.push(placementMatrix(frame, placement));
    set.units.push(placement.unit);
  }
  return [...map.values()];
}
