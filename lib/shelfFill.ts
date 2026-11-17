import type { ObjectId } from '@/types/pharmacy';
import type { ProductSpec } from '@/lib/products';

/** Deterministic RNG so products don't reshuffle on every re-render. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A product placed in a unit's LOCAL frame (x along the unit, y up, z = -depth..0). */
export interface Placement {
  spec: ProductSpec;
  x: number;
  y: number;
  z: number;
  yaw: number;
  unit: ObjectId;
}

export interface FillOptions {
  pool: ProductSpec[];
  /** Usable span along the shelf. */
  x0: number;
  x1: number;
  surface: number;
  clearance: number;
  /** Distance from the front plane (z = 0) back to the rear panel face. */
  depth: number;
  rng: () => number;
  unit: ObjectId;
  frontMargin?: number;
  /** Max rows of product front-to-back (1–2 keeps it airy but real). */
  maxRows?: number;
}

/**
 * Fills one shelf with realistic "facings": groups of 1–3 identical packs, mixed
 * sizes, small random gaps, and a second row behind where the shelf is deep enough.
 * It deliberately leaves air so the shelves never look overcrowded.
 */
export function fillShelf(o: FillOptions): Placement[] {
  const out: Placement[] = [];
  const fit = o.pool.filter((p) => p.h <= o.clearance - 0.4 && p.w <= o.x1 - o.x0);
  if (fit.length === 0) return out;

  const fm = o.frontMargin ?? 0.7;
  const maxRows = o.maxRows ?? 2;
  let cursor = o.x0 + 0.4;
  let last = -1;

  while (cursor < o.x1 - 1) {
    let idx = Math.floor(o.rng() * fit.length);
    if (fit.length > 1 && idx === last) idx = (idx + 1) % fit.length;
    last = idx;
    const spec = fit[idx];
    const facings = 1 + Math.floor(o.rng() * 3);

    for (let f = 0; f < facings; f++) {
      if (cursor + spec.w > o.x1 - 0.2) return out;
      const cx = cursor + spec.w / 2;
      const rows = Math.max(
        1,
        Math.min(maxRows, Math.floor((o.depth - fm + 0.2) / (spec.d + 0.25))),
      );
      for (let r = 0; r < rows; r++) {
        const z = -fm - spec.d / 2 - r * (spec.d + 0.25);
        if (-z + spec.d / 2 > o.depth) break;
        out.push({
          spec,
          x: cx,
          y: o.surface,
          z,
          yaw: (o.rng() - 0.5) * (r === 0 ? 0.08 : 0.2),
          unit: o.unit,
        });
      }
      cursor += spec.w + 0.15 + o.rng() * 0.35;
    }
    // Occasional breathing space between groups.
    if (o.rng() < 0.22) cursor += 0.8 + o.rng() * 2.2;
  }
  return out;
}
