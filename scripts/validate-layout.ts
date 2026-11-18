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

/* ---- 1. The approved 9 × 12 ft shop + 3 ft stock & rest room (9 × 15 ft overall) ---- */
const config = normalizeConfig(DEFAULT_CONFIG);
const L = computeLayout(config);

console.log('\n=== Approved layout ===');
console.log(`Room: ${formatFeetInches(L.W)} × ${formatFeetInches(L.L)} × ${formatFeetInches(L.H)}  (${(L.W * L.L) / 144} sq ft): ${formatFeetInches(L.shopL)} shop + ${formatFeetInches(L.L - L.shopL)} stock & rest room`);
console.log(`Width budget : cosmetics ${config.cosmetics.depth}" + aisle ${L.aisle.width}" + counter ${config.counter.depth}" + pocket ${L.pocket.x1 - L.pocket.x0}" + rack ${config.medicine.rackDepth}" = ${config.cosmetics.depth + L.aisle.width + config.counter.depth + (L.pocket.x1 - L.pocket.x0) + config.medicine.rackDepth}"`);
console.log(`Length budget: front counter table ${config.counter.depth}" + pocket ${L.pocket.y1 - L.pocket.y0}"  + OTC ${L.otcRight.length}" + back cabinets ${config.backCabinets.depth}" = ${config.counter.depth + (L.pocket.y1 - L.pocket.y0) + L.otcRight.length + config.backCabinets.depth}"\n`);

assert(L.W === 108 && L.shopL === 144 && L.H === 120, 'Shop is exactly 9 ft × 12 ft × 10 ft');
assert(L.L === 180, 'Overall building is 9 ft × 15 ft (12 ft shop + 3 ft stock & rest room)');
assert(config.cosmetics.depth + L.aisle.width + config.counter.depth + (L.pocket.x1 - L.pocket.x0) + config.medicine.rackDepth === 108, 'Across-width dimensions add up to 108"');
assert(
  config.counter.depth + (L.pocket.y1 - L.pocket.y0) + L.otcRight.length + config.backCabinets.depth === 144,
  'Along-length dimensions on the right wall add up to 144"',
);
assert(L.cosmetics.rect.x0 === 0, 'Cosmetics are on the LEFT wall');
assert(L.counter.frontLeg.x1 === L.W && L.rxRight.rect.x1 === L.W && L.otcRight.rect.x1 === L.W, 'Counter + medicine racks are on the RIGHT wall');
assert(L.back.rect.y1 === L.shopL && L.back.rect.x0 === 0, 'Extra medicine storage runs along the back of the shop, from the left wall');
assert(L.back.rect.x1 <= L.stock.door.x0, 'Back stock cabinets leave the stock-room door clear');
assert(L.stock.door.x1 <= L.W && L.W - L.stock.door.x1 <= 8, 'Back door is on the RIGHT side of the back wall');
assert(L.stock.door.width >= 32 && L.stock.door.height >= 78, `Back door is ${L.stock.door.width}" × ${L.stock.door.height}"`);
assert(L.stock.door.x0 >= 0 && L.stock.door.x1 <= L.W, 'Back door sits inside the back wall');
assert(L.stock.room.y0 === L.shopL + 4 && L.stock.room.y1 === L.L, `Stock room clear depth is ${L.stock.room.y1 - L.stock.room.y0}" behind a 4" partition`);
assert(!!L.stock.bed && L.stock.bed.x1 - L.stock.bed.x0 >= 60, 'Stock room holds a rest bed (≥ 5 ft long)');
assert(!!L.stock.bed && L.stock.bed.x1 <= L.stock.door.x0, 'Rest bed does not block the back door');
assert(L.door.x0 === 0 && L.door.x1 === L.W, 'Front is one full-width roller-shutter opening (no door, no front wall)');
assert(L.counter.frontLeg.y0 === 0 && L.counter.frontLeg.x1 === L.W, 'Counter table stands at the open front (curved corner faces the street)');
assert(L.aisle.width >= 36, `Central aisle is ${L.aisle.width}" (≥ 36")`);
assert(L.rxRight.rect.y1 === L.counter.sideLength && L.otcRight.rect.y0 === L.counter.sideLength, 'Rx and OTC racks form ONE straight run along the right wall (no L)');
assert(L.pocket.x1 - L.pocket.x0 >= 30 && L.pocket.y1 - L.pocket.y0 >= 48, `Pharmacist pocket is ${L.pocket.x1 - L.pocket.x0}" × ${L.pocket.y1 - L.pocket.y0}"`);
assert(L.counter.sideLength / L.shopL < 0.75, `Counter is ${L.counter.sideLength / 12} ft of the 12 ft shop run (not full length)`);

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
  c.room = { width: pick(70, 200), length: pick(90, 260), height: pick(90, 180), stockDepth: pick(10, 100) };
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
  const hard = res.filter((r) => ['fit', 'cosmetics-left', 'counter-right', 'back-storage', 'ceiling', 'stock-room'].includes(r.id) && r.status === 'fail');
  if (hard.length) {
    bad++;
    console.log(`  ✘ case ${i}: ${hard.map((h) => h.id).join(', ')}`);
  }
}
assert(bad === 0, 'No fixture ever overlaps another, crosses a wall or hits the ceiling');

console.log(failures === 0 ? '\nALL CHECKS PASSED ✔\n' : `\n${failures} CHECK(S) FAILED ✘\n`);
process.exit(failures === 0 ? 0 : 1);
