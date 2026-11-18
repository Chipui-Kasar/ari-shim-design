'use client';

import { useEffect, useRef, type ElementRef } from 'react';
import * as THREE from 'three';
import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { getViewPreset } from '@/lib/views';
import { walkState } from '@/lib/walkInput';

type Controls = ElementRef<typeof CameraControls>;

/** Survives re-mounts: the very first framing is instant, later ones glide. */
let initialized = false;

/**
 * Orbit / pan / zoom with smooth, animated transitions between the preset views.
 * (First-person lives in Walkthrough.tsx; the two are mutually exclusive.)
 */
export function CameraRig() {
  const controls = useRef<Controls>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const view = usePharmacyStore((s) => s.view);
  const nonce = usePharmacyStore((s) => s.viewNonce);
  const targetFov = useRef(camera.fov);

  useEffect(() => {
    const c = controls.current;
    if (!c || view === 'walkthrough') return;
    const preset = getViewPreset(view, usePharmacyStore.getState().layout, size.width / Math.max(1, size.height));
    targetFov.current = preset.fov;

    if (!initialized) {
      initialized = true;
      camera.fov = preset.fov;
      camera.updateProjectionMatrix();
      void c.setLookAt(...preset.position, ...preset.target, false);
      return;
    }
    // Start from wherever the camera currently is (e.g. leaving the walkthrough), then glide.
    if (walkState.justLeft) {
      walkState.justLeft = false;
      const dir = camera.getWorldDirection(new THREE.Vector3());
      const p = camera.position;
      void c.setLookAt(p.x, p.y, p.z, p.x + dir.x * 40, p.y + dir.y * 40, p.z + dir.z * 40, false);
    }
    void c.setLookAt(...preset.position, ...preset.target, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, nonce]);

  useFrame(({ invalidate }, dt) => {
    if (Math.abs(camera.fov - targetFov.current) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov.current, 5, dt);
      camera.updateProjectionMatrix();
      invalidate(); // frameloop is "demand": keep animating until the FOV settles
    }
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.32}
      draggingSmoothTime={0.1}
      minDistance={18}
      maxDistance={1100}
      maxPolarAngle={Math.PI * 0.52}
      dollyToCursor
      infinityDolly={false}
    />
  );
}

/** Applies the section-cut used by the Left / Right detail views. */
export function ClipController() {
  const gl = useThree((s) => s.gl);
  const view = usePharmacyStore((s) => s.view);
  const layout = usePharmacyStore((s) => s.layout);

  useEffect(() => {
    const clip = getViewPreset(view, layout, 1.6).clip;
    gl.clippingPlanes = clip
      ? [
          clip.keep === 'below'
            ? new THREE.Plane(new THREE.Vector3(-1, 0, 0), clip.at)
            : new THREE.Plane(new THREE.Vector3(1, 0, 0), -clip.at),
        ]
      : [];
    return () => {
      gl.clippingPlanes = [];
    };
  }, [gl, view, layout]);
  return null;
}
