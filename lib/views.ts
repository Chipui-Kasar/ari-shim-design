import type { ViewId, WallId, WallMode } from '@/types/pharmacy';
import type { Layout } from '@/lib/layout';

export interface ClipPlane {
  /** 'below' keeps everything with x < at; 'above' keeps x > at. */
  keep: 'below' | 'above';
  at: number;
}

export interface ViewPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  clip: ClipPlane | null;
}

export const BASE_WALLS: Record<WallId, WallMode> = {
  front: 'visible',
  back: 'visible',
  left: 'visible',
  right: 'visible',
  ceiling: 'visible',
};

/** Wall visibility applied when a view is selected (user can then override). */
export const VIEW_WALLS: Record<ViewId, Record<WallId, WallMode>> = {
  perspective: { ...BASE_WALLS, ceiling: 'hidden' },
  top: { ...BASE_WALLS, ceiling: 'hidden' },
  front: { ...BASE_WALLS },
  left: { ...BASE_WALLS, ceiling: 'hidden' },
  right: { ...BASE_WALLS, ceiling: 'hidden' },
  walkthrough: { ...BASE_WALLS },
};

export const VIEW_LABELS: Record<ViewId, string> = {
  perspective: '3D View',
  top: 'Floor Plan',
  front: 'Front View',
  left: 'Left View',
  right: 'Right View',
  walkthrough: 'Walkthrough',
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Distance at which a sphere of `radius` fits a camera with vertical fov and aspect. */
function fitDistance(radius: number, fovDeg: number, aspect: number): number {
  const v = rad(fovDeg) / 2;
  const h = Math.atan(Math.tan(v) * aspect);
  return radius / Math.sin(Math.min(v, h));
}

/** Distance so that a flat extent (w x h) is fully visible face-on. */
function fitFlat(w: number, h: number, fovDeg: number, aspect: number): number {
  const t = Math.tan(rad(fovDeg) / 2);
  return Math.max(h / (2 * t), w / (2 * t * aspect));
}

export function getViewPreset(view: ViewId, layout: Layout, aspect: number): ViewPreset {
  const { W, L, H } = layout;
  const cx = W / 2;
  const cz = -L / 2;
  const aisleX = (layout.aisle.x0 + layout.aisle.x1) / 2;

  switch (view) {
    case 'top': {
      const fov = 28;
      const dist = fitFlat(W + 100, L + 150, fov, aspect);
      return {
        // A tiny +Z offset fixes the azimuth so the plan has the BACK wall at the top
        // and the LEFT wall on the left – identical to the approved drawing.
        position: [cx, dist, cz + 20.01],
        target: [cx, 0, cz + 20],
        fov,
        clip: null,
      };
    }
    case 'front': {
      return {
        position: [aisleX, 63, 70],
        target: [W / 2, 58, -L],
        fov: 62,
        clip: null,
      };
    }
    case 'left': {
      const fov = 24;
      const halfW = layout.counter.x0 - 2; // we cut the room here, keeping the cosmetics half
      const dist = Math.max(fitFlat(L + 50, H + 40, fov, aspect), 200);
      return {
        position: [halfW / 2 + dist, 56, cz],
        target: [halfW / 2, 56, cz],
        fov,
        clip: { keep: 'below', at: halfW },
      };
    }
    case 'right': {
      const fov = 24;
      const cut = layout.counter.x0 - 1;
      const dist = Math.max(fitFlat(L + 50, H + 40, fov, aspect), 200);
      const mid = (cut + W) / 2;
      return {
        position: [mid - dist, 56, cz],
        target: [mid, 56, cz],
        fov,
        clip: { keep: 'above', at: cut },
      };
    }
    case 'walkthrough':
      return {
        position: [aisleX, 64, 90],
        target: [aisleX, 62, -L],
        fov: 74,
        clip: null,
      };
    case 'perspective':
    default: {
      const fov = 38;
      const target: [number, number, number] = [cx, 40, cz];
      const radius = 0.62 * Math.hypot(W, L, H * 0.8);
      const dist = fitDistance(radius, fov, aspect);
      const d = [-0.06, 0.74, 0.67];
      return {
        position: [target[0] + d[0] * dist, target[1] + d[1] * dist, target[2] + d[2] * dist],
        target,
        fov,
        clip: null,
      };
    }
  }
}
