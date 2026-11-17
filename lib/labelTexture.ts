import * as THREE from 'three';
import type { ProductSpec } from '@/lib/products';

/**
 * Canvas-generated labels. Text is always real, legible strings from the product
 * catalogue – never random glyphs. Client-only (uses document).
 */

const SCRIPT_FONT = '"Snell Roundhand", "Segoe Script", "Apple Chancery", "Brush Script MT", "Lucida Handwriting", cursive';
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function luminance(hex: string): number {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Shrinks the font until `text` fits `maxW`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, maxW: number, weight = 700) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && s > 6) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  if (words.length === 1) return [text];
  const lines: string[] = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${cur} ${words[i]}`;
    if (ctx.measureText(test).width <= maxW) cur = test;
    else {
      lines.push(cur);
      cur = words[i];
    }
  }
  lines.push(cur);
  return lines.slice(0, 3);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws the actual label artwork inside the rectangle (rx, ry, rw, rh). */
function drawLabel(ctx: CanvasRenderingContext2D, spec: ProductSpec, rx: number, ry: number, rw: number, rh: number) {
  const light = luminance(spec.body) > 0.55;
  const ink = light ? '#1f2a2e' : '#ffffff';
  const inkSoft = light ? 'rgba(31,42,46,0.62)' : 'rgba(255,255,255,0.78)';

  // Header band with brand.
  const bandH = rh * 0.2;
  ctx.fillStyle = spec.accent;
  ctx.fillRect(rx, ry, rw, bandH);
  ctx.fillStyle = luminance(spec.accent) > 0.6 ? '#1f2a2e' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitFont(ctx, spec.brand, bandH * 0.52, rw * 0.86, 800);
  ctx.fillText(spec.brand, rx + rw / 2, ry + bandH / 2 + 1);

  // Product name (wrapped, max 3 lines).
  ctx.fillStyle = ink;
  const nameSize = Math.min(rw * 0.2, rh * 0.15);
  ctx.font = `800 ${nameSize}px ${FONT}`;
  const lines = wrapLines(ctx, spec.name, rw * 0.84);
  const longest = lines.reduce((a, b) => (ctx.measureText(a).width > ctx.measureText(b).width ? a : b), '');
  const fs = fitFont(ctx, longest, nameSize, rw * 0.84, 800);
  const lh = fs * 1.12;
  const areaTop = ry + bandH + rh * 0.04;
  const startY = areaTop + (rh * 0.46 - lines.length * lh) / 2 + lh / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, rx + rw / 2, startY + i * lh));

  // Sub line.
  if (spec.sub) {
    ctx.fillStyle = inkSoft;
    fitFont(ctx, spec.sub, rh * 0.075, rw * 0.8, 600);
    ctx.fillText(spec.sub, rx + rw / 2, ry + rh * 0.66);
  }

  // Medical cross (first aid) or an accent medallion.
  const cx = rx + rw / 2;
  const cy = ry + rh * 0.82;
  const cr = Math.min(rw, rh) * 0.075;
  if (spec.cross) {
    ctx.fillStyle = '#c9453f';
    ctx.fillRect(cx - cr * 0.34, cy - cr, cr * 0.68, cr * 2);
    ctx.fillRect(cx - cr, cy - cr * 0.34, cr * 2, cr * 0.68);
  } else {
    ctx.fillStyle = spec.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = luminance(spec.accent) > 0.6 ? '#1f2a2e' : '#ffffff';
    ctx.fillRect(cx - cr * 0.12, cy - cr * 0.55, cr * 0.24, cr * 1.1);
    ctx.fillRect(cx - cr * 0.55, cy - cr * 0.12, cr * 1.1, cr * 0.24);
  }

  // Fine-print bars (shapes, not text).
  ctx.fillStyle = light ? 'rgba(31,42,46,0.16)' : 'rgba(255,255,255,0.28)';
  const barH = Math.max(2, rh * 0.012);
  [0.9, 0.7].forEach((k, i) => {
    roundRect(ctx, rx + rw * ((1 - k) / 2), ry + rh * (0.92 + i * 0.03), rw * k, barH, barH / 2);
    ctx.fill();
  });
}

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Front-label texture for a product.
 *  - box:  canvas = the front face (w x h)
 *  - round shapes: canvas wraps the whole circumference of the body, label centred on the front.
 */
export function getProductTexture(spec: ProductSpec, bodyHeight: number): THREE.CanvasTexture {
  const key = `${spec.id}:${bodyHeight.toFixed(2)}`;
  const hit = textureCache.get(key);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  let ctx: CanvasRenderingContext2D | null;

  if (spec.shape === 'box') {
    const ppi = 120;
    canvas.width = Math.max(64, Math.round(spec.w * ppi));
    canvas.height = Math.max(64, Math.round(spec.h * ppi));
    ctx = canvas.getContext('2d');
    if (!ctx) return makeTexture(canvas);
    ctx.fillStyle = spec.body;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLabel(ctx, spec, 0, 0, canvas.width, canvas.height);
  } else {
    const circ = Math.PI * spec.w;
    canvas.width = 512;
    canvas.height = Math.max(96, Math.round((512 * bodyHeight) / circ));
    ctx = canvas.getContext('2d');
    if (!ctx) return makeTexture(canvas);
    ctx.fillStyle = spec.body;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rw = canvas.width * 0.46;
    const rh = canvas.height * 0.86;
    drawLabel(ctx, spec, (canvas.width - rw) / 2, (canvas.height - rh) / 2, rw, rh);
  }
  const tex = makeTexture(canvas);
  textureCache.set(key, tex);
  return tex;
}

/* ------------------------------------------------------------------ */
/*  Signage / label plates                                             */
/* ------------------------------------------------------------------ */

const plateCache = new Map<string, THREE.CanvasTexture>();

export interface PlateStyle {
  bg: string;
  fg: string;
  align?: 'left' | 'center';
  /** Pixels per inch. */
  ppi?: number;
  weight?: number;
  /** Draw a small green plus before the text. */
  icon?: boolean;
}

export function getPlateTexture(text: string, wIn: number, hIn: number, s: PlateStyle): THREE.CanvasTexture {
  const key = `${text}|${wIn.toFixed(1)}|${hIn.toFixed(1)}|${s.bg}|${s.fg}|${s.align}|${s.icon}`;
  const hit = plateCache.get(key);
  if (hit) return hit;
  const ppi = s.ppi ?? 40;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(32, Math.round(wIn * ppi));
  canvas.height = Math.max(16, Math.round(hIn * ppi));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = s.fg;
    ctx.textBaseline = 'middle';
    const pad = canvas.height * 0.45;
    const iconW = s.icon ? canvas.height * 0.7 : 0;
    const maxW = canvas.width - pad * 2 - iconW;
    const size = fitFont(ctx, text, canvas.height * 0.58, maxW, s.weight ?? 700);
    ctx.font = `${s.weight ?? 700} ${size}px ${FONT}`;
    const tw = ctx.measureText(text).width;
    let x: number;
    if (s.align === 'center') {
      ctx.textAlign = 'left';
      x = (canvas.width - (tw + iconW)) / 2 + iconW;
    } else {
      ctx.textAlign = 'left';
      x = pad + iconW;
    }
    if (s.icon) {
      const cx = x - iconW * 0.55;
      const cy = canvas.height / 2;
      const r = canvas.height * 0.26;
      ctx.fillRect(cx - r * 0.3, cy - r, r * 0.6, r * 2);
      ctx.fillRect(cx - r, cy - r * 0.3, r * 2, r * 0.6);
    }
    ctx.fillText(text, x, canvas.height / 2 + 1);
  }
  const tex = makeTexture(canvas);
  plateCache.set(key, tex);
  return tex;
}

/**
 * The shop's signboard, modelled on the reference photo: a dark, back-lit board with a
 * two-circle "K" "K" logo, large white bold lettering and a smaller line underneath.
 *   (K)(K)  PHARMACY
 *   MEDICINE (capsule) COSMETICS   (clean tracked sans)
 */
export function getSignboardTexture(
  wIn: number,
  hIn: number,
  line1 = 'PHARMACY',
  line2 = 'Medicine & Cosmetics',
): THREE.CanvasTexture {
  const key = `sign|${wIn}|${hIn}|${line1}|${line2}`;
  const hit = plateCache.get(key);
  if (hit) return hit;
  const ppi = 36;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(wIn * ppi);
  canvas.height = Math.round(hIn * ppi);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const W = canvas.width;
    const H = canvas.height;
    // Board
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#16213a');
    g.addColorStop(1, '#0b1222');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = Math.max(2, H * 0.015);
    ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);

    // Round logo: one "K" in each of two overlapping discs.
    const r = H * 0.3;
    const cy = H * 0.5;
    const cx1 = H * 0.2 + r;
    const cx2 = cx1 + r * 1.5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const disc = (cx: number, fill: string) => {
      // thin board-coloured ring so the overlapping discs stay distinct
      ctx.fillStyle = '#0e1730';
      ctx.beginPath();
      ctx.arc(cx, cy, r + H * 0.018, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${r * 1.2}px ${FONT}`;
      ctx.fillText('K', cx, cy + r * 0.06);
    };
    disc(cx1, '#e8741a'); // warm orange
    disc(cx2, '#169a62'); // pharmacy green

    // Lettering
    const tx = cx2 + r * 1.35;
    const maxW = W - tx - H * 0.18;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    const s1 = fitFont(ctx, line1, H * 0.56, maxW, 800);
    ctx.font = `800 ${s1}px ${FONT}`;
    ctx.fillText(line1, tx, H * 0.43);

    // Subtitle: clean tracked sans, with a small two-tone capsule standing in for "&".
    const parts = line2.split('&').map((t) => t.trim());
    const track = (t: string) => t.toUpperCase().split('').join(String.fromCharCode(8202, 8202));
    let sz = H * 0.17;
    const fontAt = (n: number) => `500 ${n}px ${FONT}`;
    const total = (n: number) => {
      ctx.font = fontAt(n);
      const w = parts.reduce((acc, t) => acc + ctx.measureText(track(t)).width, 0);
      return parts.length === 2 ? w + n * 3.4 : w;
    };
    while (total(sz) > maxW * 0.96 && sz > 6) sz -= 0.5;
    ctx.font = fontAt(sz);
    ctx.fillStyle = '#e9ecf2';
    ctx.textAlign = 'left';
    const baseY = H * 0.77;
    let x = tx + s1 * 0.04;
    ctx.fillText(track(parts[0]), x, baseY);
    x += ctx.measureText(track(parts[0])).width;
    if (parts.length === 2) {
      const cw = sz * 1.5;
      const ch = sz * 0.62;
      const ccx = x + sz * 1.7;
      ctx.save();
      ctx.translate(ccx, baseY);
      ctx.rotate(-Math.PI / 6);
      ctx.beginPath();
      ctx.roundRect(-cw / 2, -ch / 2, cw, ch, ch / 2);
      ctx.clip();
      ctx.fillStyle = '#e8741a';
      ctx.fillRect(-cw / 2, -ch / 2, cw / 2, ch);
      ctx.fillStyle = '#169a62';
      ctx.fillRect(0, -ch / 2, cw / 2, ch);
      ctx.restore();
      x += sz * 3.4;
      ctx.fillStyle = '#e9ecf2';
      ctx.fillText(track(parts[1]), x, baseY);
    }
  }
  const tex = makeTexture(canvas);
  plateCache.set(key, tex);
  return tex;
}

/** Soft vertical gradient used for the LED "light wash" on shelf back panels. */
let washTex: THREE.CanvasTexture | null = null;
export function getWashTexture(): THREE.CanvasTexture {
  if (washTex) return washTex;
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 128);
  }
  washTex = new THREE.CanvasTexture(canvas);
  washTex.colorSpace = THREE.SRGBColorSpace;
  return washTex;
}
