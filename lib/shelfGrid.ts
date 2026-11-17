/**
 * Shared shelf maths used by BOTH the shelf structure and the product placement,
 * so products always sit exactly on the boards that are drawn.
 */

export interface ShelfGrid {
  bays: Array<{ x0: number; x1: number }>;
  levels: Array<{ index: number; surface: number; clearance: number }>;
  boardT: number;
  zoneTop: number;
}

export interface ShelfGridInput {
  length: number;
  /** Preferred bay width (inches); the actual width divides the length evenly. */
  bayTarget: number;
  /** Surface height of the first shelf (top of the base cabinet / plinth). */
  yStart: number;
  /** Underside of the top cap / top cabinet. */
  zoneTop: number;
  spacing: number;
  boardT?: number;
  minClear?: number;
}

export function computeShelfGrid(i: ShelfGridInput): ShelfGrid {
  const boardT = i.boardT ?? 0.8;
  const minClear = i.minClear ?? 5;
  const bayCount = Math.max(1, Math.round(i.length / i.bayTarget));
  const bayW = i.length / bayCount;
  const bays = Array.from({ length: bayCount }, (_, k) => ({ x0: k * bayW, x1: (k + 1) * bayW }));

  const surfaces: number[] = [];
  let y = i.yStart;
  while (i.zoneTop - y >= minClear && surfaces.length < 40) {
    surfaces.push(y);
    y += i.spacing;
  }
  const levels = surfaces.map((surface, index) => {
    const next = surfaces[index + 1];
    const clearance = next !== undefined ? next - boardT - surface : i.zoneTop - surface;
    return { index, surface, clearance };
  });
  return { bays, levels, boardT, zoneTop: i.zoneTop };
}
