'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { usePharmacyStore } from '@/store/pharmacyStore';

/** Frames to keep re-baking shadows after a change (covers React commit ordering and async mounts). */
const SHADOW_REFRESH_FRAMES = 6;

/**
 * Supports `<Canvas frameloop="demand">`:
 *  • any editor-state change (config, view, selection, hover, door, walls …) schedules a render, and
 *  • shadow maps are frozen and only re-baked when the scene can actually have changed, instead of
 *    re-rendering every shadow-casting light on every frame while the camera orbits.
 */
export function RenderOnDemand() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  // Start dirty: geometry / textures mount over the first few frames.
  const dirty = useRef(SHADOW_REFRESH_FRAMES * 5);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const unsub = usePharmacyStore.subscribe(() => {
      dirty.current = SHADOW_REFRESH_FRAMES;
      invalidate();
    });
    invalidate();
    return () => {
      unsub();
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl, invalidate]);

  useFrame(() => {
    if (dirty.current > 0) {
      dirty.current--;
      gl.shadowMap.needsUpdate = true;
      if (dirty.current > 0) invalidate();
    }
  });

  return null;
}
