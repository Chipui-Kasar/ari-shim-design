/**
 * Final design validation (headless). Run with:  npm run validate
 *
 * Verifies the approved plan numerically, then stress-tests the layout engine with
 * hundreds of random edits to prove that fixtures can never overlap or leave the room.
 */
import { DEFAULT_CONFIG, computeLayout, normalizeConfig, validateLayout } from '../lib/layout';
import { formatFeetInches } from '../lib/units';
import type { PharmacyConfig } from '../types/pharmacy';

const icon = { pass: '✔', warn: '▲', fail: '✘', info: 'ℹ' } as const;
let failures = 0;

function assert(cond: boolean, msg: string) {
  console.log(`${cond ? '✔' : '✘'} ${msg}`);
  if (!cond) failures++;
}

/* ---- 1. The approved 9 × 12 ft design ---- */
const config = normalizeConfig(DEFAULT_CONFIG);
const L = computeLayout(config);

console.log('\n=== Approved layout ===');
console.log(`Room: ${formatFeetInches(L.W)} × ${formatFeetInches(L.L)} × ${formatFeetInches(L.H)}  (${(L.W * L.L) / 144} sq ft)`);
console.log(`Width budget : cosmetics ${config.cosmetics.depth}" + aisle ${L.aisle.width}" + counter ${config.counter.depth}" + pocket ${L.pocket.x1 - L.pocket.x0}" + rack ${config.medicine.rackDepth}" = ${config.cosmetics.depth + L.aisle.width + config.counter.depth + (L.pocket.x1 - L.pocket.x0) + config.medicine.rackDepth}"`);
console.log(`Length budget: front counter table ${config.counter.depth}" + pocket ${L.pocket.y1 - L.pocket.y0}"  + OTC ${L.otcRight.length}" + back cabinets ${config.backCabinets.depth}" = ${config.counter.depth + (L.pocket.y1 - L.pocket.y0) + L.otcRight.length + config.backCabinets.depth}"\n`);

assert(L.W === 108 && L.L === 144 && L.H === 120, 'Room is exactly 9 ft × 12 ft × 10 ft');
assert(config.cosmetics.depth + L.aisle.width + config.counter.depth + (L.pocket.x1 - L.pocket.x0) + config.medicine.rackDepth === 108, 'Across-width dimensions add up to 108"');
assert(
  config.counter.depth + (L.pocket.y1 - L.pocket.y0) + L.otcRight.length + config.backCabinets.depth === 144,
  'Along-length dimensions on the right wall add up to 144"',
);
assert(L.cosmetics.rect.x0 === 0, 'Cosmetics are on the LEFT wall');
assert(L.counter.frontLeg.x1 === L.W && L.rxRight.rect.x1 === L.W && L.otcRight.rect.x1 === L.W, 'Counter + medicine racks are on the RIGHT wall');
assert(L.back.rect.y1 === L.L && L.back.rect.x0 === 0 && L.back.rect.x1 === L.W, 'Extra medicine storage spans the BACK wall');
assert(L.door.x0 === 0 && L.door.x1 === L.W, 'Front is one full-width roller-shutter opening (no door, no front wall)');
assert(L.counter.frontLeg.y0 === 0 && L.counter.frontLeg.x1 === L.W, 'Counter table stands at the open front (curved corner faces the street)');
assert(L.aisle.width >= 36, `Central aisle is ${L.aisle.width}" (≥ 36")`);
assert(L.rxRight.rect.y1 === L.counter.sideLength && L.otcRight.rect.y0 === L.counter.sideLength, 'Rx and OTC racks form ONE straight run along the right wall (no L)');
assert(L.pocket.x1 - L.pocket.x0 >= 30 && L.pocket.y1 - L.pocket.y0 >= 48, `Pharmacist pocket is ${L.pocket.x1 - L.pocket.x0}" × ${L.pocket.y1 - L.pocket.y0}"`);
assert(L.counter.sideLength / L.L < 0.75, `Counter is ${L.counter.sideLength / 12} ft of the 12 ft run (not full length)`);

console.log('\n=== Live checks (same as the in-app panel) ===');
for (const c of validateLayout(config, L)) {
  console.log(`${icon[c.status]} ${c.label.padEnd(40)} ${c.detail}`);
  if (c.status === 'fail') failures++;
}

/* ---- 2. Stress test: random edits can never break the layout ---- */
console.log('\n=== Stress test (500 random configurations) ===');
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (min: number, max: number) => min + rnd() * (max - min);
let bad = 0;
for (let i = 0; i < 500; i++) {
  const c: PharmacyConfig = structuredClone(DEFAULT_CONFIG);
  c.room = { width: pick(70, 200), length: pick(90, 260), height: pick(90, 180) };
  c.cosmetics.depth = pick(4, 30);
  c.cosmetics.topHeight = pick(40, 140);
  c.medicine.rackDepth = pick(2, 30);
  c.medicine.rackHeight = pick(60, 150);
  c.backCabinets.depth = pick(4, 40);
  c.counter.depth = pick(10, 40);
  c.counter.sideLength = pick(20, 260);
  c.counter.frontLength = pick(20, 200);
  c.door.height = pick(60, 140);
  const n = normalizeConfig(c);
  const lay = computeLayout(n);
  const res = validateLayout(n, lay);
  const hard = res.filter((r) => ['fit', 'cosmetics-left', 'counter-right', 'back-storage', 'ceiling'].includes(r.id) && r.status === 'fail');
  if (hard.length) {
    bad++;
    console.log(`  ✘ case ${i}: ${hard.map((h) => h.id).join(', ')}`);
  }
}
assert(bad === 0, 'No fixture ever overlaps another, crosses a wall or hits the ceiling');

console.log(failures === 0 ? '\nALL CHECKS PASSED ✔\n' : `\n${failures} CHECK(S) FAILED ✘\n`);
process.exit(failures === 0 ? 0 : 1);
