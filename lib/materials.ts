import * as THREE from 'three';
import type { MaterialId } from '@/types/pharmacy';

/**
 * Material library. Wood, tile and laminate surfaces are generated procedurally on
 * a canvas so the app has NO external texture dependency (and can't fail to load).
 * All UVs in this app are in INCHES, so a texture "repeat" of 1/N means the texture
 * tiles every N inches – wood grain and tile joints keep their real-world scale.
 */

export interface SurfaceDef {
  id: MaterialId;
  label: string;
  /** Swatch / base colour. */
  color: string;
  kind: 'wood' | 'paint' | 'metal';
  roughness: number;
  metalness: number;
}

export const SURFACES: Record<MaterialId, SurfaceDef> = {
  oakNatural: { id: 'oakNatural', label: 'Natural oak', color: '#c9a574', kind: 'wood', roughness: 0.55, metalness: 0 },
  oakLight: { id: 'oakLight', label: 'Light oak', color: '#dcc29b', kind: 'wood', roughness: 0.55, metalness: 0 },
  walnut: { id: 'walnut', label: 'Walnut', color: '#7a5638', kind: 'wood', roughness: 0.5, metalness: 0 },
  matteWhite: { id: 'matteWhite', label: 'Matte white', color: '#f4f3ef', kind: 'paint', roughness: 0.62, metalness: 0 },
  sage: { id: 'sage', label: 'Soft sage', color: '#a9bda3', kind: 'paint', roughness: 0.6, metalness: 0 },
  lightGrey: { id: 'lightGrey', label: 'Light grey', color: '#cfd1d2', kind: 'paint', roughness: 0.6, metalness: 0 },
  aluminium: { id: 'aluminium', label: 'Brushed aluminium', color: '#d6dade', kind: 'metal', roughness: 0.42, metalness: 0.72 },
  charcoal: { id: 'charcoal', label: 'Black / charcoal', color: '#2a2c2e', kind: 'paint', roughness: 0.5, metalness: 0.2 },
};

export const WOOD_MATERIALS: MaterialId[] = ['oakNatural', 'oakLight', 'walnut'];
export const SHELF_MATERIALS: MaterialId[] = ['oakNatural', 'oakLight', 'walnut', 'matteWhite', 'lightGrey', 'sage'];
export const RACK_MATERIALS: MaterialId[] = ['matteWhite', 'lightGrey', 'sage', 'oakLight', 'oakNatural', 'aluminium'];
export const COUNTER_MATERIALS: MaterialId[] = ['oakNatural', 'oakLight', 'walnut', 'matteWhite', 'sage', 'lightGrey'];
export const FRAME_MATERIALS: MaterialId[] = ['aluminium', 'charcoal', 'matteWhite'];

export const TINT_SWATCHES = ['#ffffff', '#f3e9d8', '#d8c3a0', '#a9bda3', '#8aa98a', '#cfd1d2', '#2a2c2e', '#7a5638'];
export const WALL_SWATCHES = ['#f2f0ea', '#ffffff', '#e8ece4', '#dfe8dc', '#ece7dd', '#e4e6e8'];
export const FLOOR_SWATCHES = ['#dcd8cf', '#e8e5de', '#c9c9c6', '#d6cdbd', '#b9b8b4', '#efefec'];

/* ------------------------------------------------------------------ */
/*  Procedural textures                                                */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const texCache = new Map<string, THREE.CanvasTexture>();

function finishTexture(c: HTMLCanvasElement, tileInches: number, aniso = 8): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tileInches, 1 / tileInches);
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

/** Near-white wood-grain map; the material colour supplies the species tone. */
function woodTexture(vertical: boolean): THREE.CanvasTexture {
  const key = `wood:${vertical}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const r = rng(vertical ? 11 : 7);

  ctx.fillStyle = '#e9e9e9';
  ctx.fillRect(0, 0, S, S);

  // Planks (each a slightly different tone).
  const planks = 4;
  const ph = S / planks;
  for (let p = 0; p < planks; p++) {
    const tone = 232 + Math.floor(r() * 22) - 11;
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillRect(0, p * ph, S, ph);
    // Long grain lines.
    for (let i = 0; i < 34; i++) {
      const y = p * ph + r() * ph;
      const a = 0.04 + r() * 0.1;
      ctx.strokeStyle = `rgba(70,50,30,${a})`;
      ctx.lineWidth = 0.6 + r() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      let yy = y;
      for (let x = 0; x <= S; x += 32) {
        yy += (r() - 0.5) * 2.2;
        ctx.lineTo(x, Math.min(p * ph + ph - 1, Math.max(p * ph + 1, yy)));
      }
      ctx.stroke();
    }
    // A knot now and then.
    if (r() < 0.45) {
      const kx = r() * S;
      const ky = p * ph + ph * (0.25 + r() * 0.5);
      for (let k = 4; k > 0; k--) {
        ctx.strokeStyle = `rgba(80,55,30,${0.1 + (4 - k) * 0.05})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(kx, ky, k * 5, k * 2.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Plank joint.
    ctx.fillStyle = 'rgba(40,28,16,0.35)';
    ctx.fillRect(0, p * ph, S, 1.2);
  }

  const t = finishTexture(c, 48);
  if (vertical) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
  }
  texCache.set(key, t);
  return t;
}

/** Light-grey porcelain tile with soft veining and a visible grout joint. One tile per texture. */
function tileTexture(tileInches: number): THREE.CanvasTexture {
  const key = `tile:${tileInches}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const r = rng(99);

  ctx.fillStyle = '#f1f0ed';
  ctx.fillRect(0, 0, S, S);
  // Mottling.
  for (let i = 0; i < 420; i++) {
    const g = 205 + Math.floor(r() * 45);
    ctx.fillStyle = `rgba(${g},${g},${g - 2},${0.05 + r() * 0.07})`;
    ctx.beginPath();
    ctx.arc(r() * S, r() * S, 6 + r() * 34, 0, Math.PI * 2);
    ctx.fill();
  }
  // Veins.
  for (let v = 0; v < 7; v++) {
    ctx.strokeStyle = `rgba(150,148,142,${0.05 + r() * 0.08})`;
    ctx.lineWidth = 0.8 + r() * 2.2;
    ctx.beginPath();
    let x = r() * S;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < S) {
      x += (r() - 0.5) * 60;
      y += 40 + r() * 50;
      ctx.quadraticCurveTo(x + (r() - 0.5) * 40, y - 20, x, y);
    }
    ctx.stroke();
  }
  // Grout joint (drawn on all edges; repeats seamlessly into a grid).
  const j = 5;
  ctx.fillStyle = '#b4b2ac';
  ctx.fillRect(0, 0, S, j);
  ctx.fillRect(0, 0, j, S);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, j, S, 1.5);
  ctx.fillRect(j, 0, 1.5, S);

  const t = finishTexture(c, tileInches, 16);
  texCache.set(key, t);
  return t;
}

/* ------------------------------------------------------------------ */
/*  Material factories (cached)                                        */
/* ------------------------------------------------------------------ */

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export interface SurfaceOptions {
  tint?: string | null;
  /** Wood grain direction on the UV's v axis (use on vertical panels). */
  vertical?: boolean;
}

export function getSurfaceMaterial(id: MaterialId, opts: SurfaceOptions = {}): THREE.MeshStandardMaterial {
  const def = SURFACES[id];
  const key = `s:${id}:${opts.tint ?? ''}:${opts.vertical ? 'v' : 'h'}`;
  const hit = matCache.get(key);
  if (hit) return hit;

  const color = new THREE.Color(def.color);
  if (opts.tint) {
    // Tint blends toward the chosen colour so the species/texture still reads.
    color.lerp(new THREE.Color(opts.tint), def.kind === 'wood' ? 0.45 : 0.8);
  }
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: def.roughness,
    metalness: def.metalness,
    map: def.kind === 'wood' ? woodTexture(!!opts.vertical) : null,
  });
  if (def.kind === 'wood') m.roughness = def.roughness;
  matCache.set(key, m);
  return m;
}

export function getFloorMaterial(color: string, tileSize: number): THREE.MeshStandardMaterial {
  const key = `floor:${color}:${tileSize}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    color,
    map: tileTexture(tileSize),
    roughness: 0.24,
    metalness: 0.02,
    envMapIntensity: 1.1,
  });
  matCache.set(key, m);
  return m;
}

export function getPaintMaterial(color: string, roughness = 0.88): THREE.MeshStandardMaterial {
  const key = `paint:${color}:${roughness}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  matCache.set(key, m);
  return m;
}

/** Brushed aluminium / charcoal etc. for frames. */
export function getFrameMaterial(id: MaterialId) {
  return getSurfaceMaterial(id);
}

/** Clear tempered glass (cheap alpha glass – no transmission pass). */
let glass: THREE.MeshPhysicalMaterial | null = null;
export function getGlassMaterial(): THREE.MeshPhysicalMaterial {
  if (!glass) {
    glass = new THREE.MeshPhysicalMaterial({
      color: '#e8f2f0',
      transparent: true,
      opacity: 0.16,
      roughness: 0.03,
      metalness: 0,
      envMapIntensity: 1.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }
  return glass;
}

/** Solid white counter-top (solid-surface / Corian style). */
let counterTop: THREE.MeshStandardMaterial | null = null;
export function getCounterTopMaterial(): THREE.MeshStandardMaterial {
  if (!counterTop) {
    counterTop = new THREE.MeshStandardMaterial({ color: '#f6f5f2', roughness: 0.34, metalness: 0 });
  }
  return counterTop;
}

/** Colour temperature (Kelvin) -> neutral-leaning RGB for LED fixtures. */
export function kelvinToColor(k: number): THREE.Color {
  const t = k / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp255 = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  const warm = new THREE.Color().setRGB(clamp255(r), clamp255(g), clamp255(b), THREE.SRGBColorSpace);
  // Keep fixtures reading as "neutral white" rather than strongly tinted.
  return warm.lerp(new THREE.Color('#ffffff'), 0.55);
}
