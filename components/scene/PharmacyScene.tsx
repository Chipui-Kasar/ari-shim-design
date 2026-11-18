'use client';

import '@/lib/silenceThreeClock';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { Lighting } from '@/components/scene/Lighting';
import { Room } from '@/components/scene/Room';
import { CosmeticsShelves } from '@/components/scene/CosmeticsShelves';
import { CosmeticsProducts } from '@/components/scene/CosmeticsProducts';
import { PharmacyCounter } from '@/components/scene/PharmacyCounter';
import { MedicineShelves } from '@/components/scene/MedicineShelves';
import { MedicineProducts } from '@/components/scene/MedicineProducts';
import { Dimensions } from '@/components/scene/Dimensions';
import { SelectionBox } from '@/components/scene/SelectionBox';
import { CameraRig, ClipController } from '@/components/scene/CameraControls';
import { Walkthrough } from '@/components/scene/Walkthrough';
import { RenderOnDemand } from '@/components/scene/RenderOnDemand';

/** Flags the UI once the first frames have been rendered (drives the loading indicator). */
function ReadyNotifier() {
  const frames = useRef(0);
  const setReady = usePharmacyStore((s) => s.setSceneReady);
  useFrame(({ invalidate }) => {
    if (frames.current < 12) {
      frames.current++;
      if (frames.current === 12) setReady(true);
      else invalidate(); // frameloop is "demand": keep rendering until the scene has settled
    }
  });
  return null;
}

/** Ambient occlusion, bloom on the LEDs, filmic tone mapping and anti-aliasing. */
function Effects() {
  const quality = usePharmacyStore((s) => s.config.lighting.quality);
  const tone = <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />;

  if (quality === 'low') {
    return (
      <EffectComposer key="low" multisampling={0} enableNormalPass={false}>
        {tone}
      </EffectComposer>
    );
  }
  return (
    <EffectComposer key={quality} multisampling={0} enableNormalPass={false}>
      <N8AO
        aoRadius={quality === 'high' ? 16 : 12}
        distanceFalloff={1.2}
        intensity={quality === 'high' ? 3.2 : 2.6}
        quality={quality === 'high' ? 'medium' : 'low'}
        halfRes={quality !== 'high'}
      />
      <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.25} intensity={0.55} radius={0.7} />
      {tone}
      <SMAA />
    </EffectComposer>
  );
}

/** The 3D viewport. All scene code is kept separate from the editor UI. */
export default function PharmacyScene() {
  const view = usePharmacyStore((s) => s.view);
  const select = usePharmacyStore((s) => s.select);

  return (
    <Canvas
      shadows="percentage"
      flat
      frameloop="demand"
      dpr={[1, 1.25]}
      camera={{ fov: 38, near: 1, far: 8000, position: [160, 230, 170] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none' }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={['#dfe4e6']} />
      <Suspense fallback={null}>
        <Lighting />
        <Room />
        <CosmeticsShelves />
        <CosmeticsProducts />
        <PharmacyCounter />
        <MedicineShelves />
        <MedicineProducts />
        <Dimensions />
        <SelectionBox />
        {view === 'walkthrough' ? <Walkthrough /> : <CameraRig />}
        <ClipController />
        <RenderOnDemand />
        <Effects />
        <ReadyNotifier />
      </Suspense>
    </Canvas>
  );
}
