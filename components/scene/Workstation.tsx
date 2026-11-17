'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Layout } from '@/lib/layout';

/** Clean, legible dispensing-software screen (drawn shapes + a few real words). */
function makeScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 380;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f3f6f5';
  ctx.fillRect(0, 0, c.width, c.height);
  // header
  ctx.fillStyle = '#7fa27a';
  ctx.fillRect(0, 0, c.width, 54);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(22, 14, 8, 26);
  ctx.fillRect(13, 23, 26, 8);
  ctx.font = '700 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('KK Pharmacy', 52, 28);
  ctx.font = '600 16px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('Dispensing', 520, 28);
  // sidebar
  ctx.fillStyle = '#e4ebe3';
  ctx.fillRect(0, 54, 150, c.height - 54);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i === 1 ? '#7fa27a' : '#cfd9ce';
    ctx.fillRect(16, 76 + i * 44, 118, 28);
  }
  // table rows
  for (let r = 0; r < 6; r++) {
    ctx.fillStyle = r % 2 ? '#ffffff' : '#eaf0ee';
    ctx.fillRect(170, 76 + r * 38, 450, 32);
    ctx.fillStyle = '#b6c3be';
    ctx.fillRect(184, 88 + r * 38, 150, 8);
    ctx.fillRect(360, 88 + r * 38, 80, 8);
    ctx.fillRect(540, 88 + r * 38, 60, 8);
  }
  // total bar
  ctx.fillStyle = '#2f4a3c';
  ctx.fillRect(170, 318, 450, 44);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('Total', 186, 341);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const dark = new THREE.MeshStandardMaterial({ color: '#23262a', roughness: 0.42, metalness: 0.15 });
const lightPlastic = new THREE.MeshStandardMaterial({ color: '#e8eaeb', roughness: 0.5, metalness: 0.05 });
const greyMetal = new THREE.MeshStandardMaterial({ color: '#b9bec3', roughness: 0.35, metalness: 0.85 });
const paper = new THREE.MeshStandardMaterial({ color: '#fbfbf8', roughness: 0.9 });
const grommetMat = new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.6 });
const cableMat = new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.7 });

function Box({
  p, s, m, rot,
}: {
  p: [number, number, number];
  s: [number, number, number];
  m: THREE.Material;
  rot?: [number, number, number];
}) {
  return (
    <mesh position={p} rotation={rot} material={m} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}

/** Cable grommet with a short cable stub disappearing into the counter. */
function Grommet({ p, from }: { p: [number, number, number]; from: [number, number, number] }) {
  const tube = useMemo(() => {
    const mid = new THREE.Vector3((p[0] + from[0]) / 2, p[1] + 0.35, (p[2] + from[2]) / 2);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...from), mid, new THREE.Vector3(p[0], p[1] - 0.2, p[2])]);
    return new THREE.TubeGeometry(curve, 16, 0.2, 6, false);
  }, [p, from]);
  return (
    <group>
      <mesh position={[p[0], p[1] + 0.04, p[2]]} material={grommetMat} receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.12, 20]} />
      </mesh>
      <mesh geometry={tube} material={cableMat} />
    </group>
  );
}

/**
 * Computer workstation, POS terminal, receipt printer, scanner and cable grommets
 * on the pharmacist side of the L-counter. Positions are derived from the layout
 * so they follow any counter resize.
 */
export function Workstation({ layout, counterHeight }: { layout: Layout; counterHeight: number }) {
  const screen = useMemo(() => {
    const t = makeScreenTexture();
    return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.3 });
  }, []);

  const h = counterHeight + 0.05;
  const { x0, depth: Cd, sideLength: Ls } = layout.counter;
  const pocket = layout.pocket;
  const ym = (pocket.y0 + pocket.y1) / 2 - 2;
  const toScene = (x: number, y: number, up = 0): [number, number, number] => [x, h + up, -y];

  // The pharmacist stands in the pocket (behind the front leg), so the POS side faces -Z (towards the back).
  const monitorP = toScene(x0 + 6.5, ym);
  const kbP = toScene(x0 + 15, ym);
  const mouseP = toScene(x0 + 15.5, ym + 11);
  const posY = Cd - 7;
  const posP = toScene(pocket.x0 + 9, posY);
  const printerP = toScene(pocket.x0 + 25, Cd - 6.5);
  const scannerP = toScene(pocket.x1 - 3, Cd - 3.2);
  const cardP = toScene(pocket.x0 + 12, 4.4);
  const sanitiserP = toScene(x0 + 7, Math.min(Ls - 14, Cd + 8));

  return (
    <group>
      {/* ---- Monitor (faces the pharmacist: +X) ---- */}
      <group position={monitorP} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0.25, 0.4]} s={[8.5, 0.5, 6.5]} m={dark} />
        <Box p={[0, 2.6, -0.6]} s={[2.4, 4.6, 0.9]} m={dark} />
        <Box p={[0, 3.4 + 6.4, 0]} s={[21.8, 12.8, 0.8]} m={dark} />
        <mesh position={[0, 3.4 + 6.4, 0.41]} material={screen}>
          <planeGeometry args={[20.8, 11.8]} />
        </mesh>
      </group>
      <Grommet p={toScene(x0 + 3.5, ym)} from={toScene(x0 + 6.3, ym, 0.6)} />

      {/* ---- Keyboard + mouse ---- */}
      <group position={kbP} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0.4, 0]} s={[16.5, 0.8, 5.6]} m={dark} rot={[-0.05, 0, 0]} />
        {Array.from({ length: 4 }, (_, r) => (
          <Box key={r} p={[0, 0.85, -1.9 + r * 1.25]} s={[15.4, 0.08, 0.95]} m={lightPlastic} />
        ))}
      </group>
      <group position={mouseP} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0.6, 0]} s={[2.5, 1.1, 4.1]} m={lightPlastic} />
      </group>

      {/* ---- POS billing machine (faces the pharmacist) ---- */}
      <group position={posP} rotation={[0, Math.PI, 0]}>
        <Box p={[0, 0.5, 0]} s={[9, 1, 7.2]} m={dark} />
        <Box p={[0, 3.2, -1.5]} s={[1.6, 5, 1.2]} m={dark} rot={[-0.1, 0, 0]} />
        <Box p={[0, 6.4, -1]} s={[8.4, 6, 0.8]} m={dark} rot={[-0.38, 0, 0]} />
        <mesh position={[0, 6.4, -0.56]} rotation={[-0.38, 0, 0]} material={screen}>
          <planeGeometry args={[7.6, 5.2]} />
        </mesh>
      </group>
      <Grommet p={toScene(pocket.x0 + 9, posY - 6.2)} from={toScene(pocket.x0 + 9, posY - 3.4, 0.5)} />

      {/* ---- Receipt printer ---- */}
      <group position={printerP} rotation={[0, Math.PI, 0]}>
        <Box p={[0, 2.6, 0]} s={[5.6, 5.2, 7]} m={lightPlastic} />
        <Box p={[0, 4.4, 3.52]} s={[4.2, 0.35, 0.1]} m={dark} />
        <Box p={[0, 0.3 + 5.35, 3.9]} s={[3.6, 0.05, 2]} m={paper} rot={[0.5, 0, 0]} />
        <Box p={[0, 5.3, 0]} s={[5.7, 0.3, 7.1]} m={greyMetal} />
      </group>
      <Grommet p={toScene(pocket.x0 + 25, Cd - 12.8)} from={toScene(pocket.x0 + 25, Cd - 10, 0.4)} />

      {/* ---- Barcode scanner on stand ---- */}
      <group position={scannerP} rotation={[0, Math.PI, 0]}>
        <Box p={[0, 0.2, 0]} s={[3, 0.4, 3]} m={dark} />
        <Box p={[0, 2.4, 0]} s={[1.6, 4.2, 1.6]} m={dark} rot={[0.15, 0, 0]} />
        <Box p={[0, 4.6, 0.6]} s={[1.7, 1.6, 2.4]} m={dark} />
      </group>

      {/* ---- Customer-facing card terminal ---- */}
      <group position={cardP}>
        <Box p={[0, 0.6, 0]} s={[3.6, 1.2, 5.8]} m={dark} rot={[0.35, 0, 0]} />
        <Box p={[0, 1.25, 0.5]} s={[2.8, 0.08, 2.2]} m={lightPlastic} rot={[0.35, 0, 0]} />
      </group>

      {/* ---- Hand sanitiser pump ---- */}
      <group position={sanitiserP}>
        <mesh position={[0, 3, 0]} material={lightPlastic} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 6, 20]} />
        </mesh>
        <mesh position={[0, 6.4, 0]} material={greyMetal}>
          <cylinderGeometry args={[0.45, 0.6, 0.8, 12]} />
        </mesh>
        <Box p={[0.5, 7, 0]} s={[1.6, 0.35, 0.7]} m={greyMetal} />
      </group>
    </group>
  );
}
