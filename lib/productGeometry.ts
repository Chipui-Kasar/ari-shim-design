import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ProductSpec } from '@/lib/products';
import { getProductTexture } from '@/lib/labelTexture';

/**
 * Builds real 3D geometry for each pack (tubes, pump bottles, jars, aerosol cans,
 * perfume flacons, cartons). Origin = bottom centre, label faces +Z.
 * Each design becomes 1–3 parts; every part is rendered as ONE InstancedMesh.
 */

export interface ProductPart {
  id: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  /** Glass parts render after opaque ones. */
  transparent: boolean;
}

const SEG = 28;

function cyl(rTop: number, rBottom: number, h: number, y0: number, seg = SEG, thetaStart = 0) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, false, thetaStart, Math.PI * 2);
  g.translate(0, y0 + h / 2, 0);
  return g;
}

function box(w: number, h: number, d: number, x: number, y0: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y0 + h / 2, z);
  return g;
}

function tinted(g: THREE.BufferGeometry, hex: string) {
  const c = new THREE.Color(hex);
  const n = g.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const m = mergeGeometries(list, false);
  list.forEach((g) => g.dispose());
  return m ?? new THREE.BufferGeometry();
}

const cache = new Map<string, ProductPart[]>();

export function getProductParts(spec: ProductSpec): ProductPart[] {
  const hit = cache.get(spec.id);
  if (hit) return hit;
  const parts = build(spec);
  cache.set(spec.id, parts);
  return parts;
}

function labelMaterial(spec: ProductSpec, bodyH: number) {
  return new THREE.MeshStandardMaterial({
    map: getProductTexture(spec, bodyH),
    roughness: 0.42,
    metalness: spec.shape === 'can' ? 0.45 : 0.04,
  });
}

function plastic(roughness = 0.38) {
  return new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness: 0.1 });
}

function build(spec: ProductSpec): ProductPart[] {
  const { w, h, d } = spec;
  const r = w / 2;

  switch (spec.shape) {
    case 'box': {
      const g = new THREE.BoxGeometry(w, h, d);
      g.translate(0, h / 2, 0);
      const side = new THREE.Color(spec.body).lerp(new THREE.Color(spec.accent), 0.4);
      const mat = (c: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
      const front = labelMaterial(spec, h);
      return [
        {
          id: `${spec.id}:box`,
          geometry: g,
          material: [mat(side), mat(side), mat(spec.body), mat(spec.body), front, mat(spec.body)],
          transparent: false,
        },
      ];
    }

    case 'tube': {
      const capH = 0.75;
      const crimpH = 0.5;
      const hb = h - capH - crimpH;
      const body = cyl(r, r * 0.86, hb, capH, SEG, Math.PI);
      const cap = tinted(cyl(r * 0.8, r * 0.84, capH, 0), spec.cap);
      const crimp = tinted(box(w * 1.02, crimpH, 0.14, 0, h - crimpH, 0), spec.accent);
      return [
        { id: `${spec.id}:body`, geometry: body, material: labelMaterial(spec, hb), transparent: false },
        { id: `${spec.id}:fit`, geometry: merge([cap, crimp]), material: plastic(), transparent: false },
      ];
    }

    case 'bottle': {
      const hb = h * 0.68;
      const hs = h * 0.1;
      const hn = h * 0.04;
      const hc = h * 0.18;
      const rn = r * 0.42;
      const body = cyl(r, r, hb, 0, SEG, Math.PI);
      const shoulder = tinted(cyl(rn, r, hs, hb), spec.body);
      const neck = tinted(cyl(rn, rn, hn, hb + hs), spec.body);
      const cap = tinted(cyl(rn * 1.35, rn * 1.35, hc, hb + hs + hn), spec.cap);
      return [
        { id: `${spec.id}:body`, geometry: body, material: labelMaterial(spec, hb), transparent: false },
        { id: `${spec.id}:fit`, geometry: merge([shoulder, neck, cap]), material: plastic(), transparent: false },
      ];
    }

    case 'pump': {
      const hb = h * 0.78;
      const hs = h * 0.06;
      const hc = h * 0.04;
      const hst = h * 0.06;
      const rn = r * 0.38;
      const body = cyl(r, r, hb, 0, SEG, Math.PI);
      const shoulder = tinted(cyl(rn * 1.1, r, hs, hb), spec.body);
      const collar = tinted(cyl(rn * 1.3, rn * 1.3, hc, hb + hs), spec.cap);
      const stem = tinted(cyl(rn * 0.42, rn * 0.42, hst, hb + hs + hc), spec.cap);
      const headY = hb + hs + hc + hst;
      const head = tinted(box(rn * 3.0, h * 0.035, rn * 1.5, 0, headY, 0), spec.cap);
      const spout = tinted(box(rn * 0.8, h * 0.026, r * 0.95, 0, headY + h * 0.004, r * 0.55), spec.cap);
      return [
        { id: `${spec.id}:body`, geometry: body, material: labelMaterial(spec, hb), transparent: false },
        { id: `${spec.id}:fit`, geometry: merge([shoulder, collar, stem, head, spout]), material: plastic(), transparent: false },
      ];
    }

    case 'jar': {
      const hb = h * 0.72;
      const hl = h - hb;
      const body = cyl(r, r, hb, 0, 32, Math.PI);
      const lid = tinted(cyl(r * 1.02, r * 1.02, hl, hb, 32), spec.cap);
      return [
        { id: `${spec.id}:body`, geometry: body, material: labelMaterial(spec, hb), transparent: false },
        { id: `${spec.id}:fit`, geometry: lid.clone(), material: plastic(0.3), transparent: false },
      ];
    }

    case 'can': {
      const hb = h * 0.8;
      const hd = h * 0.08;
      const hc = h * 0.12;
      const body = cyl(r, r, hb, 0, 32, Math.PI);
      const dome = tinted(cyl(r * 0.55, r, hd, hb), '#c9cdd1');
      const cap = tinted(cyl(r * 0.6, r * 0.6, hc, hb + hd), spec.cap);
      return [
        { id: `${spec.id}:body`, geometry: body, material: labelMaterial(spec, hb), transparent: false },
        { id: `${spec.id}:fit`, geometry: merge([dome, cap]), material: plastic(0.3), transparent: false },
      ];
    }

    case 'perfume': {
      const hg = h * 0.74;
      const glass = box(w, hg, d, 0, 0, 0);
      const liquid = box(w * 0.84, hg * 0.78, d * 0.7, 0, hg * 0.1, 0);
      const rc = Math.min(w, d) * 0.28;
      const neck = tinted(cyl(rc * 0.55, rc * 0.55, h * 0.05, hg), spec.cap);
      const cap = tinted(cyl(rc, rc, h * 0.21, hg + h * 0.05), spec.cap);
      return [
        {
          id: `${spec.id}:glass`,
          geometry: glass,
          material: new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.3,
            roughness: 0.04,
            metalness: 0,
            envMapIntensity: 1.8,
            depthWrite: false,
          }),
          transparent: true,
        },
        {
          id: `${spec.id}:liquid`,
          geometry: liquid,
          material: new THREE.MeshStandardMaterial({
            color: spec.liquid ?? '#e9b7c0',
            roughness: 0.15,
            emissive: spec.liquid ?? '#e9b7c0',
            emissiveIntensity: 0.12,
          }),
          transparent: false,
        },
        {
          id: `${spec.id}:fit`,
          geometry: merge([neck, cap]),
          material: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.85 }),
          transparent: false,
        },
      ];
    }
  }
}
