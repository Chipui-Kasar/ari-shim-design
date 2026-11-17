import type { CheckResult, ObjectId, PharmacyConfig } from '@/types/pharmacy';
import { clamp, formatFeetInches } from '@/lib/units';

/* ------------------------------------------------------------------ */
/*  Defaults                                                          */
/* ------------------------------------------------------------------ */

/** Fixed construction details (inches). */
export const RACK_BASE_HEIGHT = 34; // closed lower cabinet / dispensing-counter height
export const RACK_TOP_CLOSED = 16; // closed upper cabinet
export const WALL_THICKNESS = 4;

export const DEFAULT_CONFIG: PharmacyConfig = {
  room: { width: 108, length: 144, height: 120 }, // 9 ft x 12 ft x 10 ft
  finishes: {
    wallColor: '#f2f0ea',
    floorColor: '#dcd8cf',
    ceilingColor: '#fbfbf8',
    tileSize: 24,
  },
  cosmetics: {
    depth: 12,
    plinth: 12,
    topHeight: 90,
    spacing: 14,
    material: 'oakNatural',
    tint: null,
    glassSections: 2,
  },
  medicine: {
    rackDepth: 10,
    rackHeight: 102,
    spacing: 12,
    material: 'matteWhite',
    tint: null,
  },
  backCabinets: { depth: 12, height: 102, material: 'matteWhite', tint: null },
  counter: {
    sideLength: 84, // 7'-0" along the right wall
    frontLength: 60, // 5'-0" across the front
    depth: 20,
    height: 36,
    material: 'oakNatural',
    tint: null,
  },
  door: { height: 98, frame: 'aluminium' },
  lighting: {
    intensity: 1,
    temperature: 4000,
    downlights: true,
    shelfLeds: true,
    cove: true,
    counterLight: true,
    quality: 'high',
  },
};

/* ------------------------------------------------------------------ */
/*  Geometry types                                                     */
/* ------------------------------------------------------------------ */

/** Plan rectangle. x from the left wall, y from the front wall (inches). */
export interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Direction (in plan coordinates) a unit's front faces. */
export type Facing = '+x' | '-x' | '+y' | '-y';

export interface UnitLayout {
  id: ObjectId;
  /** Unique key (several units can share an ObjectId, e.g. rxRight + otcRight). */
  key: string;
  rect: Rect;
  facing: Facing;
  /** Length along the wall. */
  length: number;
  depth: number;
  /** Scene-space placement of the unit's local origin (front edge, start corner). */
  position: [number, number, number];
  /** Rotation about Y so the unit's local +Z points out of the front face. */
  yaw: number;
}

export interface Box3Like {
  min: [number, number, number];
  max: [number, number, number];
}

export interface Layout {
  W: number;
  L: number;
  H: number;
  aisle: { x0: number; x1: number; width: number };
  pocket: Rect;
  cosmetics: UnitLayout;
  rxRight: UnitLayout;
  otcRight: UnitLayout;
  /** Wall-hung shelves above the counter's front leg (keeps the right wall continuous). */
  rxGap: UnitLayout;
  /** Underside height of the wall-hung unit (counter height + 14"). */
  gapBase: number;
  back: UnitLayout;
  counter: {
    sideLeg: Rect;
    frontLeg: Rect;
    /** Left-most x of the L (outer corner). */
    x0: number;
    sideLength: number;
    frontLength: number;
    depth: number;
    height: number;
  };
  /** The roller-shutter opening: the full width of the shopfront. */
  door: { x0: number; x1: number; width: number; height: number };
  /** Plan footprints of every solid object the player can't walk through. */
  footprints: Array<{ id: string; rect: Rect }>;
  /** Selection boxes in scene space (inches). */
  bounds: Record<ObjectId, Box3Like[]>;
}

/* ------------------------------------------------------------------ */
/*  Normalisation – keeps interdependent values legal                  */
/* ------------------------------------------------------------------ */

export function normalizeConfig(input: PharmacyConfig): PharmacyConfig {
  const c: PharmacyConfig = structuredClone(input);
  const { room } = c;
  room.width = clamp(room.width, 84, 180);
  room.length = clamp(room.length, 108, 240);
  room.height = clamp(room.height, 96, 168);

  c.cosmetics.depth = clamp(c.cosmetics.depth, 8, 20);
  c.cosmetics.plinth = clamp(c.cosmetics.plinth, 6, 18);
  c.cosmetics.topHeight = clamp(c.cosmetics.topHeight, 60, Math.min(96, room.height - 18));
  c.cosmetics.spacing = clamp(c.cosmetics.spacing, 10, 22);
  c.cosmetics.glassSections = clamp(Math.round(c.cosmetics.glassSections), 0, 4);

  c.medicine.rackDepth = clamp(c.medicine.rackDepth, 6, 18);
  c.medicine.rackHeight = clamp(c.medicine.rackHeight, 72, Math.min(110, room.height - 10));
  c.medicine.spacing = clamp(c.medicine.spacing, 8, 20);

  c.backCabinets.depth = clamp(c.backCabinets.depth, 8, 30);
  c.backCabinets.height = clamp(c.backCabinets.height, 72, Math.min(110, room.height - 10));

  c.counter.depth = clamp(c.counter.depth, 16, 28);
  c.counter.height = clamp(c.counter.height, 32, 44);

  // ---- Width budget: cosmetics + 24" aisle + L-counter (depth + 24" pocket + rack) must fit. ----
  const MIN_AISLE = 24;
  const MIN_POCKET = 24;
  let over = c.cosmetics.depth + c.counter.depth + c.medicine.rackDepth + MIN_POCKET + MIN_AISLE - room.width;
  const shrink = (current: number, min: number) => {
    const take = Math.min(Math.max(0, over), current - min);
    over -= take;
    return current - take;
  };
  if (over > 0) c.cosmetics.depth = shrink(c.cosmetics.depth, 8);
  if (over > 0) c.medicine.rackDepth = shrink(c.medicine.rackDepth, 6);
  if (over > 0) c.counter.depth = shrink(c.counter.depth, 16);

  const R = c.medicine.rackDepth;
  const cd = c.cosmetics.depth;

  // ---- Length budget: counter side leg (depth + rack + 36" pocket) + 12" clear + back cabinets. ----
  const lsMin = c.counter.depth + R + 36;
  const maxBack = room.length - 12 - lsMin;
  c.backCabinets.depth = clamp(c.backCabinets.depth, 8, Math.max(8, Math.min(30, maxBack)));
  const backD = c.backCabinets.depth;

  const lfMin = c.counter.depth + R + MIN_POCKET;
  const lfMax = Math.max(lfMin, room.width - cd - MIN_AISLE);
  c.counter.frontLength = clamp(c.counter.frontLength, lfMin, lfMax);

  const lsMax = Math.max(lsMin, room.length - backD - 12);
  c.counter.sideLength = clamp(c.counter.sideLength, lsMin, lsMax);

  c.door.height = clamp(c.door.height, 80, Math.min(110, room.height - 10));

  c.lighting.intensity = clamp(c.lighting.intensity, 0.2, 2);
  c.lighting.temperature = clamp(c.lighting.temperature, 2700, 6500);
  return c;
}

/* ------------------------------------------------------------------ */
/*  Layout engine                                                      */
/* ------------------------------------------------------------------ */

function makeUnit(
  id: ObjectId,
  key: string,
  rect: Rect,
  facing: Facing,
): UnitLayout {
  switch (facing) {
    case '+x': // right-hand face of a LEFT-wall unit
      return {
        id, key, rect, facing,
        length: rect.y1 - rect.y0,
        depth: rect.x1 - rect.x0,
        position: [rect.x1, 0, -rect.y0],
        yaw: Math.PI / 2,
      };
    case '-x': // left-hand face of a RIGHT-wall unit
      return {
        id, key, rect, facing,
        length: rect.y1 - rect.y0,
        depth: rect.x1 - rect.x0,
        position: [rect.x0, 0, -rect.y1],
        yaw: -Math.PI / 2,
      };
    case '-y': // faces the entrance (back-wall unit)
      return {
        id, key, rect, facing,
        length: rect.x1 - rect.x0,
        depth: rect.y1 - rect.y0,
        position: [rect.x0, 0, -rect.y0],
        yaw: 0,
      };
    case '+y': // faces the back wall (front-wall unit)
      return {
        id, key, rect, facing,
        length: rect.x1 - rect.x0,
        depth: rect.y1 - rect.y0,
        position: [rect.x1, 0, -rect.y1],
        yaw: Math.PI,
      };
  }
}

function boxOf(rect: Rect, h: number): Box3Like {
  return { min: [rect.x0, 0, -rect.y1], max: [rect.x1, h, -rect.y0] };
}

export function computeLayout(config: PharmacyConfig): Layout {
  const { width: W, length: L, height: H } = config.room;
  const cd = config.cosmetics.depth;
  const R = config.medicine.rackDepth;
  const backD = config.backCabinets.depth;
  const Cd = config.counter.depth;
  const Lf = config.counter.frontLength;
  const Ls = config.counter.sideLength;

  const counterX0 = W - Lf;
  // The L now sits at the OPEN FRONT: its rounded outer corner is at the front-left (x0, y = 0).
  const sideLeg: Rect = { x0: counterX0, x1: counterX0 + Cd, y0: 0, y1: Ls };
  const frontLeg: Rect = { x0: counterX0, x1: W, y0: 0, y1: Cd };
  // The pocket is open at its back end: the Rx racks are ONE straight run along the right wall.
  const pocket: Rect = { x0: counterX0 + Cd, x1: W - R, y0: Cd, y1: Ls };

  const cosmeticsRect: Rect = { x0: 0, x1: cd, y0: 0, y1: L - backD };
  const rxRightRect: Rect = { x0: W - R, x1: W, y0: Cd, y1: Ls };
  const otcRect: Rect = { x0: W - R, x1: W, y0: Ls, y1: L - backD };
  const backRect: Rect = { x0: 0, x1: W, y0: L - backD, y1: L };
  const gapRect: Rect = { x0: W - R, x1: W, y0: 0, y1: Cd };

  const cosmetics = makeUnit('cosmetics', 'cosmetics', cosmeticsRect, '+x');
  const rxRight = makeUnit('rxRacks', 'rxRight', rxRightRect, '-x');
  const otcRight = makeUnit('otcRacks', 'otcRight', otcRect, '-x');
  const back = makeUnit('backCabinets', 'back', backRect, '-y');
  const rxGap = makeUnit('rxRacks', 'rxGap', gapRect, '-x');

  const aisleX0 = cd;
  const aisleX1 = counterX0;
  const aisleW = aisleX1 - aisleX0;

  const cH = config.counter.height;
  const mH = config.medicine.rackHeight;

  const bounds: Record<ObjectId, Box3Like[]> = {
    cosmetics: [boxOf(cosmeticsRect, config.cosmetics.topHeight + 8)],
    rxRacks: [boxOf(rxRightRect, mH), { min: [gapRect.x0, cH + 14, -gapRect.y1], max: [gapRect.x1, mH, -gapRect.y0] }],
    otcRacks: [boxOf(otcRect, mH)],
    backCabinets: [boxOf(backRect, config.backCabinets.height)],
    counter: [boxOf(sideLeg, cH + 2), boxOf(frontLeg, cH + 2)],
    door: [
      {
        min: [0, 0, -2],
        max: [W, config.door.height, WALL_THICKNESS + 2],
      },
    ],
  };

  return {
    W, L, H,
    aisle: { x0: aisleX0, x1: aisleX1, width: aisleW },
    pocket,
    cosmetics, rxRight, otcRight, rxGap, back,
    gapBase: cH + 14,
    counter: {
      sideLeg, frontLeg,
      x0: counterX0,
      sideLength: Ls,
      frontLength: Lf,
      depth: Cd,
      height: cH,
    },
    door: { x0: 0, x1: W, width: W, height: config.door.height },
    footprints: [
      { id: 'cosmetics', rect: cosmeticsRect },
      // The side leg starts where the front leg ends so the L's corner isn't counted twice.
      { id: 'counterSide', rect: { ...sideLeg, y0: Cd } },
      { id: 'counterFront', rect: frontLeg },
      { id: 'rxRight', rect: rxRightRect },
      { id: 'otc', rect: otcRect },
      { id: 'back', rect: backRect },
    ],
    bounds,
  };
}

/* ------------------------------------------------------------------ */
/*  Validation – mirrors the "Final design validation" checklist       */
/* ------------------------------------------------------------------ */

function overlapArea(a: Rect, b: Rect): number {
  const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return ox > 0.01 && oy > 0.01 ? ox * oy : 0;
}

export function validateLayout(config: PharmacyConfig, layout: Layout): CheckResult[] {
  const out: CheckResult[] = [];
  const { W, L, H } = layout;

  const exact = W === 108 && L === 144 && H === 120;
  out.push({
    id: 'room',
    label: 'Room size',
    status: exact ? 'pass' : 'info',
    detail: exact
      ? `Exactly 9'-0" × 12'-0" (108 sq ft), ceiling 10'-0"`
      : `Custom: ${formatFeetInches(W)} × ${formatFeetInches(L)}, ceiling ${formatFeetInches(H)}`,
  });

  const cosmeticsLeft = layout.cosmetics.rect.x0 === 0;
  out.push({
    id: 'cosmetics-left',
    label: 'Cosmetics on LEFT wall',
    status: cosmeticsLeft ? 'pass' : 'fail',
    detail: `Cosmetics rack is flush with the left wall (x = 0), ${formatFeetInches(layout.cosmetics.length)} long`,
  });

  const counterRight = layout.counter.sideLeg.x1 < W && layout.counter.frontLeg.x1 === W;
  const racksRight = layout.rxRight.rect.x1 === W && layout.otcRight.rect.x1 === W;
  out.push({
    id: 'counter-right',
    label: 'Counter + medicine racks on RIGHT wall',
    status: counterRight && racksRight ? 'pass' : 'fail',
    detail: `L-counter at the right-front corner, curve facing the street (${formatFeetInches(layout.counter.sideLength)} side × ${formatFeetInches(layout.counter.frontLength)} front); Rx and OTC racks on the right wall`,
  });

  out.push({
    id: 'back-storage',
    label: 'Extra medicine storage at BACK',
    status: layout.back.rect.y1 === L ? 'pass' : 'fail',
    detail: `Closed stock cabinets ${formatFeetInches(layout.back.depth)} deep across the full ${formatFeetInches(W)} back wall`,
  });

  out.push({
    id: 'entrance-front',
    label: 'Entrance at FRONT (roller shutter)',
    status: 'pass',
    detail: `Open shopfront (no door, no front wall): ${formatFeetInches(layout.door.width)} wide roller shutter that pushes up / pulls down; counter table at the front`,
  });

  const aisle = layout.aisle.width;
  out.push({
    id: 'aisle',
    label: 'Customer aisle',
    status: aisle >= 36 ? 'pass' : aisle >= 30 ? 'warn' : 'fail',
    detail: `${formatFeetInches(aisle)} clear beside the counter (36" recommended minimum)`,
  });

  const pocketW = layout.pocket.x1 - layout.pocket.x0;
  const pocketD = layout.pocket.y1 - layout.pocket.y0;
  out.push({
    id: 'pharmacist',
    label: 'Pharmacist working space',
    status: pocketW >= 30 && pocketD >= 48 ? 'pass' : pocketW >= 24 && pocketD >= 36 ? 'warn' : 'fail',
    detail: `${formatFeetInches(pocketW)} wide × ${formatFeetInches(pocketD)} deep, racks within reach`,
  });

  // Everything inside the room + no overlaps.
  let inside = true;
  let overlaps = 0;
  const fp = layout.footprints;
  fp.forEach((a, i) => {
    const r = a.rect;
    if (r.x0 < -0.01 || r.y0 < -0.01 || r.x1 > W + 0.01 || r.y1 > L + 0.01) inside = false;
    for (let j = i + 1; j < fp.length; j++) {
      if (overlapArea(r, fp[j].rect) > 0) overlaps++;
    }
  });
  out.push({
    id: 'fit',
    label: 'All fixtures fit inside the room',
    status: inside && overlaps === 0 ? 'pass' : 'fail',
    detail: inside && overlaps === 0 ? 'No fixture overlaps another or crosses a wall' : `${overlaps} overlap(s) detected`,
  });

  const maxTop = Math.max(config.medicine.rackHeight, config.backCabinets.height, config.cosmetics.topHeight + 8);
  out.push({
    id: 'ceiling',
    label: 'Ceiling height',
    status: maxTop <= H - 6 ? 'pass' : 'fail',
    detail: `Tallest fixture ${formatFeetInches(maxTop)} under a ${formatFeetInches(H)} ceiling`,
  });

  const counterShare = layout.counter.sideLength / L;
  out.push({
    id: 'counter-length',
    label: 'Counter does not run the full length',
    status: counterShare < 0.75 ? 'pass' : 'warn',
    detail: `Counter covers ${Math.round(counterShare * 100)}% of the room length; open medicine shelving continues behind it`,
  });

  return out;
}
