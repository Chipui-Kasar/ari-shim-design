/**
 * Product catalogue. Every brand name is FICTIONAL and every label is drawn from
 * these strings (clean canvas text, never random glyphs).
 * Dimensions are in inches and are realistic retail pack sizes.
 */

export type ProductShape = 'box' | 'tube' | 'bottle' | 'pump' | 'jar' | 'perfume' | 'can';

export type ProductCategory =
  | 'skin'
  | 'sun'
  | 'hair'
  | 'hygiene'
  | 'fragrance'
  | 'beauty'
  | 'tablets'
  | 'capsules'
  | 'syrups'
  | 'firstAid'
  | 'vitamins'
  | 'devices';

export interface ProductSpec {
  id: string;
  shape: ProductShape;
  /** Width (round shapes: diameter). */
  w: number;
  h: number;
  /** Depth (round shapes: diameter). */
  d: number;
  body: string;
  accent: string;
  cap: string;
  brand: string;
  name: string;
  sub?: string;
  category: ProductCategory;
  /** Transparent glass body (perfume / serum). */
  liquid?: string;
  /** Draw a first-aid cross on the label. */
  cross?: boolean;
}

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  skin: 'SKIN CARE',
  sun: 'SUN & BODY CARE',
  hair: 'HAIR CARE',
  hygiene: 'PERSONAL HYGIENE',
  fragrance: 'FRAGRANCE',
  beauty: 'BEAUTY',
  tablets: 'TABLETS',
  capsules: 'CAPSULES',
  syrups: 'SYRUPS & LIQUIDS',
  firstAid: 'FIRST AID',
  vitamins: 'VITAMINS & SUPPLEMENTS',
  devices: 'HEALTHCARE DEVICES',
};

type Seed = Omit<ProductSpec, 'id'>;
const mk = (id: string, s: Seed): ProductSpec => ({ id, ...s });

/* ----------------------------- COSMETICS ---------------------------- */

export const COSMETIC_PRODUCTS: ProductSpec[] = [
  // Skin care
  mk('fw-aqua', { shape: 'tube', w: 1.7, h: 5.8, d: 1.7, body: '#e9f4f3', accent: '#3aa6a0', cap: '#2f8f8a', brand: 'AQUAPURE', name: 'Gentle Face Wash', sub: '150 ml', category: 'skin' }),
  mk('fw-nat', { shape: 'tube', w: 1.7, h: 5.4, d: 1.7, body: '#eaf3e3', accent: '#6f9d4f', cap: '#557c3a', brand: 'NATURA', name: 'Foaming Cleanser', sub: 'Aloe & Cucumber', category: 'skin' }),
  mk('mo-derma', { shape: 'jar', w: 3.3, h: 2.5, d: 3.3, body: '#f5f1ea', accent: '#8aa98a', cap: '#8aa98a', brand: 'DERMA CARE', name: 'Moisture Cream', sub: '50 ml', category: 'skin' }),
  mk('mo-derma-xl', { shape: 'jar', w: 4.1, h: 2.9, d: 4.1, body: '#f5f1ea', accent: '#d6b98c', cap: '#caa874', brand: 'DERMA CARE', name: 'Rich Night Cream', sub: '100 ml', category: 'skin' }),
  mk('serum-c', { shape: 'bottle', w: 1.6, h: 4.6, d: 1.6, body: '#f2b25a', accent: '#d8892a', cap: '#222222', brand: 'GLOW LAB', name: 'Vitamin C Serum', sub: '30 ml', category: 'skin' }),
  mk('serum-h', { shape: 'bottle', w: 1.6, h: 4.6, d: 1.6, body: '#bfe0e6', accent: '#3f8fa3', cap: '#222222', brand: 'GLOW LAB', name: 'Hydra Serum', sub: '30 ml', category: 'skin' }),
  mk('toner', { shape: 'pump', w: 2.3, h: 6.6, d: 2.3, body: '#f3dede', accent: '#d58e92', cap: '#d58e92', brand: 'AURELIA', name: 'Rose Toner', sub: '200 ml', category: 'skin' }),
  // Sun & body
  mk('sun-50', { shape: 'tube', w: 1.9, h: 6.2, d: 1.9, body: '#fff1b8', accent: '#f08a1c', cap: '#f08a1c', brand: 'SUNSHIELD', name: 'Sunscreen SPF 50', sub: 'Broad spectrum', category: 'sun' }),
  mk('sun-kids', { shape: 'bottle', w: 2.2, h: 6.2, d: 2.2, body: '#bfe7f7', accent: '#2f9bd6', cap: '#f08a1c', brand: 'SUNSHIELD', name: 'Kids SPF 50+', sub: 'Water resistant', category: 'sun' }),
  mk('lotion-soft', { shape: 'pump', w: 2.7, h: 8.2, d: 2.7, body: '#eef3fb', accent: '#6f8fcf', cap: '#6f8fcf', brand: 'SOFTSKIN', name: 'Body Lotion', sub: '400 ml', category: 'sun' }),
  mk('lotion-lav', { shape: 'pump', w: 2.6, h: 7.8, d: 2.6, body: '#ece6f5', accent: '#8b6fb8', cap: '#8b6fb8', brand: 'SOFTSKIN', name: 'Lavender Lotion', sub: '400 ml', category: 'sun' }),
  mk('lotion-shea', { shape: 'tube', w: 2.2, h: 6.4, d: 2.2, body: '#f6ecdc', accent: '#b88a4e', cap: '#b88a4e', brand: 'SOFTSKIN', name: 'Shea Hand Cream', sub: '100 ml', category: 'sun' }),
  // Hair care
  mk('sham-silk', { shape: 'pump', w: 2.7, h: 8.6, d: 2.7, body: '#dfe9f6', accent: '#3e6fb5', cap: '#3e6fb5', brand: 'SILKEN', name: 'Shampoo', sub: 'Daily care 400 ml', category: 'hair' }),
  mk('cond-silk', { shape: 'bottle', w: 2.7, h: 8.2, d: 2.7, body: '#f6e1ea', accent: '#c8567f', cap: '#c8567f', brand: 'SILKEN', name: 'Conditioner', sub: 'Daily care 400 ml', category: 'hair' }),
  mk('sham-herb', { shape: 'pump', w: 2.9, h: 9.3, d: 2.9, body: '#e1eddb', accent: '#5e8e45', cap: '#5e8e45', brand: 'HERBAL ROOT', name: 'Anti-Dandruff Shampoo', sub: '500 ml', category: 'hair' }),
  mk('cond-herb', { shape: 'bottle', w: 2.9, h: 8.8, d: 2.9, body: '#e1eddb', accent: '#8bb36f', cap: '#8bb36f', brand: 'HERBAL ROOT', name: 'Conditioner', sub: '500 ml', category: 'hair' }),
  mk('hair-oil', { shape: 'bottle', w: 1.9, h: 5.4, d: 1.9, body: '#e2a64c', accent: '#8a5a14', cap: '#2b2b2b', brand: 'AURELIA', name: 'Argan Hair Oil', sub: '100 ml', category: 'hair' }),
  mk('hair-spray', { shape: 'can', w: 2.2, h: 7.4, d: 2.2, body: '#d9dde0', accent: '#4a5560', cap: '#2b2b2b', brand: 'HOLDFAST', name: 'Hair Spray', sub: 'Strong hold', category: 'hair' }),
  mk('hair-mask', { shape: 'jar', w: 3.9, h: 3.2, d: 3.9, body: '#f4e7d8', accent: '#c08a5a', cap: '#c08a5a', brand: 'SILKEN', name: 'Repair Hair Mask', sub: '250 ml', category: 'hair' }),
  // Personal hygiene
  mk('hand-wash', { shape: 'pump', w: 2.5, h: 7.2, d: 2.5, body: '#dcf0e4', accent: '#3f9b6b', cap: '#3f9b6b', brand: 'PUREWASH', name: 'Hand Wash', sub: '300 ml', category: 'hygiene' }),
  mk('deo', { shape: 'can', w: 1.9, h: 5.6, d: 1.9, body: '#eef0f2', accent: '#2f6fa8', cap: '#2f6fa8', brand: 'FRESH', name: 'Deodorant', sub: '48h protection', category: 'hygiene' }),
  mk('soap', { shape: 'box', w: 3.6, h: 2.4, d: 1.4, body: '#f4efe6', accent: '#9bb78a', cap: '#9bb78a', brand: 'CLEANSE', name: 'Moisture Soap', sub: '3 x 100 g', category: 'hygiene' }),
  mk('paste', { shape: 'box', w: 1.6, h: 6.4, d: 1.6, body: '#e8f1fb', accent: '#2f78c4', cap: '#2f78c4', brand: 'ORALFRESH', name: 'Fluoride Toothpaste', sub: '100 ml', category: 'hygiene' }),
  mk('mouth', { shape: 'bottle', w: 2.7, h: 8.0, d: 2.7, body: '#cfe9f6', accent: '#2f9bd6', cap: '#2f9bd6', brand: 'ORALFRESH', name: 'Mouthwash', sub: 'Fresh mint 500 ml', category: 'hygiene' }),
  mk('brush', { shape: 'box', w: 2.0, h: 7.6, d: 0.9, body: '#ffffff', accent: '#2f78c4', cap: '#2f78c4', brand: 'ORALFRESH', name: 'Toothbrush', sub: 'Medium', category: 'hygiene' }),
  // Fragrance (glass)
  mk('perf-a', { shape: 'perfume', w: 2.6, h: 4.4, d: 1.3, body: '#ffffff', accent: '#d4af6a', cap: '#c9a24e', brand: 'AURELIA', name: 'Eau de Parfum', category: 'fragrance', liquid: '#f2b5bd' }),
  mk('perf-b', { shape: 'perfume', w: 2.2, h: 5.2, d: 2.2, body: '#ffffff', accent: '#2a2a2a', cap: '#1d1d1d', brand: 'VELOUR', name: 'Noir Parfum', category: 'fragrance', liquid: '#6b4f33' }),
  mk('perf-c', { shape: 'perfume', w: 1.7, h: 5.6, d: 1.7, body: '#ffffff', accent: '#bcd3e8', cap: '#b6bcc2', brand: 'VELOUR', name: 'Aqua Cologne', category: 'fragrance', liquid: '#8dc4e6' }),
  mk('perf-box', { shape: 'box', w: 3.0, h: 6.0, d: 2.2, body: '#1f1f1f', accent: '#d4af6a', cap: '#d4af6a', brand: 'VELOUR', name: 'Noir Parfum', sub: 'Gift set', category: 'fragrance' }),
  // Beauty
  mk('nail', { shape: 'bottle', w: 1.3, h: 2.9, d: 1.3, body: '#e86b8b', accent: '#c4416a', cap: '#222222', brand: 'AURELIA', name: 'Nail Colour', category: 'beauty' }),
  mk('found', { shape: 'pump', w: 1.5, h: 4.4, d: 1.5, body: '#e8c9a6', accent: '#b88a60', cap: '#b88a60', brand: 'AURELIA', name: 'Skin Tint', sub: '30 ml', category: 'beauty' }),
  mk('face-mask', { shape: 'box', w: 3.4, h: 5.2, d: 0.9, body: '#f6eef0', accent: '#d58e92', cap: '#d58e92', brand: 'GLOW LAB', name: 'Sheet Mask', sub: '5 pack', category: 'beauty' }),
];

/* ----------------------------- MEDICINES ---------------------------- */

export const MEDICINE_PRODUCTS: ProductSpec[] = [
  // Tablets – cartons
  mk('tab-pain', { shape: 'box', w: 4.2, h: 2.6, d: 1.0, body: '#ffffff', accent: '#2f78c4', cap: '#2f78c4', brand: 'KK CARE', name: 'Pain Relief', sub: '500 mg tablets', category: 'tablets' }),
  mk('tab-cold', { shape: 'box', w: 4.2, h: 2.6, d: 1.0, body: '#fff3e2', accent: '#ef8a2b', cap: '#ef8a2b', brand: 'KK CARE', name: 'Cold & Flu', sub: 'Day & night', category: 'tablets' }),
  mk('tab-allergy', { shape: 'box', w: 3.8, h: 2.5, d: 0.9, body: '#f1ebf8', accent: '#8b5fc0', cap: '#8b5fc0', brand: 'MEDIRA', name: 'Allergy Relief', sub: '10 mg tablets', category: 'tablets' }),
  mk('tab-acid', { shape: 'box', w: 4.0, h: 2.4, d: 1.1, body: '#e4f5ee', accent: '#2f9b78', cap: '#2f9b78', brand: 'MEDIRA', name: 'Antacid', sub: 'Chewable mint', category: 'tablets' }),
  mk('tab-bp', { shape: 'box', w: 4.2, h: 2.6, d: 0.9, body: '#ffffff', accent: '#c9453f', cap: '#c9453f', brand: 'CARDIVA', name: 'Heart Care', sub: '30 tablets', category: 'tablets' }),
  mk('tab-dia', { shape: 'box', w: 4.2, h: 2.6, d: 0.9, body: '#e6f4f6', accent: '#2c8fa3', cap: '#2c8fa3', brand: 'CARDIVA', name: 'Diabetes Care', sub: '60 tablets', category: 'tablets' }),
  mk('tab-anti', { shape: 'box', w: 4.4, h: 2.8, d: 1.0, body: '#ffffff', accent: '#2a2f45', cap: '#2a2f45', brand: 'MEDIRA', name: 'Antibiotic', sub: 'Prescription only', category: 'tablets' }),
  // Capsules – portrait cartons
  mk('cap-omega', { shape: 'box', w: 2.7, h: 4.2, d: 1.5, body: '#fff6d6', accent: '#e0a31c', cap: '#e0a31c', brand: 'VITALIS', name: 'Omega-3', sub: '60 capsules', category: 'capsules' }),
  mk('cap-pro', { shape: 'box', w: 2.6, h: 4.0, d: 1.4, body: '#e6f4e2', accent: '#4f9a3f', cap: '#4f9a3f', brand: 'VITALIS', name: 'Probiotic', sub: '30 capsules', category: 'capsules' }),
  mk('cap-anti', { shape: 'box', w: 2.6, h: 3.8, d: 1.3, body: '#ffffff', accent: '#2f78c4', cap: '#2f78c4', brand: 'KK CARE', name: 'Anti-Inflammatory', sub: '20 capsules', category: 'capsules' }),
  mk('cap-iron', { shape: 'box', w: 2.6, h: 4.0, d: 1.4, body: '#f9e5e0', accent: '#c4573d', cap: '#c4573d', brand: 'VITALIS', name: 'Iron + Folate', sub: '60 capsules', category: 'capsules' }),
  // Syrups & liquids
  mk('syr-cough', { shape: 'bottle', w: 2.6, h: 6.2, d: 2.6, body: '#c7792a', accent: '#f6efe2', cap: '#ffffff', brand: 'KK CARE', name: 'Cough Syrup', sub: '100 ml', category: 'syrups' }),
  mk('syr-acid', { shape: 'bottle', w: 2.4, h: 6.4, d: 2.4, body: '#f4f7f9', accent: '#2f9b78', cap: '#2f9b78', brand: 'MEDIRA', name: 'Antacid Liquid', sub: '200 ml', category: 'syrups' }),
  mk('syr-kids', { shape: 'bottle', w: 2.4, h: 5.6, d: 2.4, body: '#f6c9d4', accent: '#d65c80', cap: '#ffffff', brand: 'KK CARE', name: 'Kids Syrup', sub: 'Strawberry 100 ml', category: 'syrups' }),
  mk('syr-ors', { shape: 'bottle', w: 2.3, h: 6.0, d: 2.3, body: '#d8eefb', accent: '#2f9bd6', cap: '#ffffff', brand: 'MEDIRA', name: 'Oral Rehydration', sub: '200 ml', category: 'syrups' }),
  mk('syr-box', { shape: 'box', w: 2.4, h: 5.4, d: 2.4, body: '#ffffff', accent: '#c7792a', cap: '#c7792a', brand: 'KK CARE', name: 'Cough Syrup', sub: 'Carton', category: 'syrups' }),
  // First aid
  mk('fa-kit', { shape: 'box', w: 8.0, h: 5.4, d: 3.0, body: '#ffffff', accent: '#c9453f', cap: '#c9453f', brand: 'KK CARE', name: 'First Aid Kit', sub: '60 pieces', category: 'firstAid', cross: true }),
  mk('fa-band', { shape: 'box', w: 4.0, h: 2.8, d: 0.9, body: '#fff0e6', accent: '#e08a5a', cap: '#e08a5a', brand: 'KK CARE', name: 'Plasters', sub: '40 assorted', category: 'firstAid' }),
  mk('fa-gauze', { shape: 'box', w: 3.2, h: 2.4, d: 2.4, body: '#ffffff', accent: '#2f78c4', cap: '#2f78c4', brand: 'KK CARE', name: 'Gauze Rolls', sub: '6 pack', category: 'firstAid' }),
  mk('fa-antis', { shape: 'bottle', w: 2.1, h: 5.4, d: 2.1, body: '#8a5a2e', accent: '#f4ece0', cap: '#ffffff', brand: 'KK CARE', name: 'Antiseptic', sub: '100 ml', category: 'firstAid' }),
  mk('fa-cotton', { shape: 'box', w: 4.4, h: 3.4, d: 3.0, body: '#f4f7fb', accent: '#5a8fc4', cap: '#5a8fc4', brand: 'KK CARE', name: 'Cotton Wool', sub: '200 g', category: 'firstAid' }),
  mk('fa-elastic', { shape: 'box', w: 4.4, h: 2.8, d: 1.8, body: '#f3efe6', accent: '#8a6f4e', cap: '#8a6f4e', brand: 'KK CARE', name: 'Elastic Bandage', sub: '10 cm', category: 'firstAid' }),
  // Vitamins & supplements
  mk('vit-c', { shape: 'jar', w: 3.0, h: 4.4, d: 3.0, body: '#fff1d6', accent: '#f08a1c', cap: '#f08a1c', brand: 'VITALIS', name: 'Vitamin C 1000', sub: '90 tablets', category: 'vitamins' }),
  mk('vit-multi', { shape: 'jar', w: 3.3, h: 5.0, d: 3.3, body: '#e6f3e2', accent: '#4f9a3f', cap: '#4f9a3f', brand: 'VITALIS', name: 'Multivitamin', sub: 'Adults 120 tablets', category: 'vitamins' }),
  mk('vit-d', { shape: 'box', w: 2.7, h: 3.8, d: 1.5, body: '#fff7cc', accent: '#e0b81c', cap: '#e0b81c', brand: 'VITALIS', name: 'Vitamin D3', sub: '2000 IU', category: 'vitamins' }),
  mk('vit-cal', { shape: 'jar', w: 3.1, h: 4.6, d: 3.1, body: '#e6eef8', accent: '#3e6fb5', cap: '#3e6fb5', brand: 'VITALIS', name: 'Calcium + Zinc', sub: '60 tablets', category: 'vitamins' }),
  mk('vit-b', { shape: 'box', w: 2.7, h: 3.8, d: 1.5, body: '#f8e6ee', accent: '#c8567f', cap: '#c8567f', brand: 'VITALIS', name: 'B-Complex', sub: '60 capsules', category: 'vitamins' }),
  // Healthcare devices (medical equipment packaging)
  mk('dev-therm', { shape: 'box', w: 6.0, h: 2.4, d: 1.4, body: '#ffffff', accent: '#2c8fa3', cap: '#2c8fa3', brand: 'LUMEN HEALTH', name: 'Digital Thermometer', category: 'devices' }),
  mk('dev-bp', { shape: 'box', w: 7.0, h: 5.5, d: 4.4, body: '#ffffff', accent: '#2f78c4', cap: '#2f78c4', brand: 'LUMEN HEALTH', name: 'Blood Pressure Monitor', sub: 'Upper arm', category: 'devices' }),
  mk('dev-gluc', { shape: 'box', w: 5.0, h: 3.4, d: 1.8, body: '#e6f4f6', accent: '#2c8fa3', cap: '#2c8fa3', brand: 'LUMEN HEALTH', name: 'Glucose Meter', sub: 'Starter kit', category: 'devices' }),
  mk('dev-oxi', { shape: 'box', w: 3.8, h: 2.6, d: 2.2, body: '#f1ebf8', accent: '#8b5fc0', cap: '#8b5fc0', brand: 'LUMEN HEALTH', name: 'Pulse Oximeter', category: 'devices' }),
  mk('dev-mask', { shape: 'box', w: 7.0, h: 3.8, d: 3.2, body: '#e8f3fb', accent: '#2f9bd6', cap: '#2f9bd6', brand: 'KK CARE', name: 'Face Masks', sub: '50 pieces', category: 'devices' }),
  mk('dev-san', { shape: 'pump', w: 2.4, h: 6.6, d: 2.4, body: '#e1f2e9', accent: '#3f9b6b', cap: '#3f9b6b', brand: 'KK CARE', name: 'Hand Sanitiser', sub: '250 ml', category: 'devices' }),
];

export function poolFor(categories: ProductCategory[], source: ProductSpec[]): ProductSpec[] {
  return source.filter((p) => categories.includes(p.category));
}

/* --------------------------- placement plans ------------------------ */

/** Category order (bottom shelf -> top shelf) for each medicine unit. */
export const MEDICINE_PLANS: Record<string, ProductCategory[]> = {
  rxRight: ['firstAid', 'tablets', 'tablets', 'capsules', 'syrups', 'syrups'],
  otcRight: ['firstAid', 'devices', 'vitamins', 'vitamins', 'devices', 'firstAid'],
  rxGap: ['vitamins', 'firstAid', 'devices', 'vitamins'],
  back: ['tablets', 'syrups', 'capsules', 'tablets', 'vitamins', 'capsules'],
};

/** Category per cosmetics bay (front -> back). */
export const COSMETIC_BAY_PLAN: ProductCategory[][] = [
  ['skin', 'beauty'],
  ['sun', 'skin'],
  ['hair'],
  ['hygiene'],
  ['hair', 'hygiene'],
  ['sun', 'beauty'],
];

export const COSMETIC_BAY_SIGNS: string[] = [
  'SKIN CARE',
  'SUN & BODY CARE',
  'HAIR CARE',
  'PERSONAL HYGIENE',
  'HAIR & STYLING',
  'BODY & BEAUTY',
];
