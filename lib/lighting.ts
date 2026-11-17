import type { Layout } from '@/lib/layout';

/** Plan-space (x, y-from-front) positions of the recessed LED downlights. */
export function downlightPositions(layout: Layout): Array<{ x: number; y: number }> {
  const { W, L } = layout;
  const rows = Math.max(2, Math.round(L / 36));
  const xAisle = (layout.aisle.x0 + layout.aisle.x1) / 2;
  const xCounter = (layout.counter.x0 + W) / 2;
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < rows; i++) {
    const y = ((i + 0.5) * L) / rows;
    out.push({ x: xAisle, y });
    out.push({ x: xCounter, y });
  }
  return out;
}
