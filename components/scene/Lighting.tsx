'use client';

import { useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { downlightPositions, stockLightPosition } from '@/lib/lighting';
import { kelvinToColor } from '@/lib/materials';

/**
 * ~4000 K neutral-white retail lighting:
 *  • procedural studio environment (no network HDRI) for soft ambient + reflections
 *  • one recessed spot per downlight, a couple of which cast soft shadows
 *  • emissive LED strips / cove are drawn by the fixtures themselves
 */
export function Lighting() {
  const layout = usePharmacyStore((s) => s.layout);
  const lighting = usePharmacyStore((s) => s.config.lighting);
  const color = useMemo(() => kelvinToColor(lighting.temperature), [lighting.temperature]);
  const I = lighting.intensity;
  const lights = useMemo(() => downlightPositions(layout), [layout]);
  const stockLight = useMemo(() => stockLightPosition(layout), [layout]);

  const shadowCount = lighting.quality === 'high' ? 2 : lighting.quality === 'medium' ? 1 : 0;
  // Shadow-casting spots: aisle column, spread along the room.
  const shadowIdx = useMemo(() => {
    const aisle = lights.map((_, i) => i).filter((i) => i % 2 === 0);
    const picks: number[] = [];
    if (shadowCount >= 1) picks.push(aisle[Math.floor(aisle.length / 2)]);
    if (shadowCount >= 2) picks.push(aisle[aisle.length - 1]);
    return picks;
  }, [lights, shadowCount]);

  return (
    <>
      <Environment resolution={256} frames={1} environmentIntensity={0.5 * Math.min(1.3, 0.4 + I * 0.6)}>
        <color attach="background" args={['#9aa0a4']} />
        {/* big soft overhead panel */}
        <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={[18, 18, 1]} />
        {/* window-ish side fills */}
        <Lightformer form="rect" intensity={1.1} color="#fff6ea" position={[-9, 3, 2]} rotation-y={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#eef4ff" position={[9, 3, -2]} rotation-y={-Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, 3, 9]} rotation-y={Math.PI} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, 3, -9]} scale={[14, 6, 1]} />
      </Environment>

      <hemisphereLight args={['#ffffff', '#d9d3c7', 0.2 * I]} />

      {lighting.downlights &&
        lights.map((p, i) => {
          const cast = shadowIdx.includes(i);
          return (
            <spotLight
              key={i}
              position={[p.x, layout.H - 1.5, -p.y]}
              angle={0.95}
              penumbra={1}
              decay={0}
              intensity={0.28 * I}
              color={color}
              castShadow={cast}
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0004}
              shadow-normalBias={0.35}
              shadow-radius={6}
              shadow-camera-near={2}
              shadow-camera-far={layout.H + 30}
            >
              <object3D attach="target" position={[0, -layout.H, 0]} />
            </spotLight>
          );
        })}

      {/* Stock & rest room: one soft downlight behind the partition (no shadow map). */}
      {lighting.downlights && (
        <spotLight
          position={[stockLight.x, layout.H - 1.5, -stockLight.y]}
          angle={1.05}
          penumbra={1}
          decay={0}
          intensity={0.36 * I}
          color={color}
        >
          <object3D attach="target" position={[0, -layout.H, 0]} />
        </spotLight>
      )}
    </>
  );
}
