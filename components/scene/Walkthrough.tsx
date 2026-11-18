'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { WALL_THICKNESS } from '@/lib/layout';
import { setWalkWake, walkInput, walkState } from '@/lib/walkInput';

const EYE = 64; // 5'-4" eye height
const RADIUS = 9; // body radius (the 36" aisle stays comfortably passable)
const WALK = 62; // inches / second
const RUN = 120;

interface Box {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/**
 * First-person walkthrough: start outside the entrance, walk the central aisle.
 * WASD / arrows to move, Shift to run, mouse (pointer-lock) or drag to look.
 * Solid fixtures and walls block the player; the 36" aisle stays passable.
 */
export function Walkthrough() {
  const { camera, gl, invalidate } = useThree();
  const layout = usePharmacyStore((s) => s.layout);

  const yaw = useRef(0);
  const pitch = useRef(-0.02);
  const keys = useRef<Record<string, boolean>>({});
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const travelled = useRef(0);
  const wasMoving = useRef(false);

  const colliders = useMemo<Box[]>(() => {
    const T = WALL_THICKNESS;
    const { W, L } = layout;
    const list: Box[] = [
      { x0: -T, x1: 0, z0: -(L + T), z1: T }, // left wall
      { x0: W, x1: W + T, z0: -(L + T), z1: T }, // right wall
      { x0: -T, x1: W + T, z0: -(L + T), z1: -L }, // back wall
    ];
    for (const f of layout.footprints) {
      list.push({ x0: f.rect.x0, x1: f.rect.x1, z0: -f.rect.y1, z1: -f.rect.y0 });
    }
    return list;
  }, [layout]);

  // Initial pose: just outside the door, looking in.
  useEffect(() => {
    const cx = (layout.aisle.x0 + layout.aisle.x1) / 2;
    camera.position.set(cx, EYE, 96);
    yaw.current = 0;
    pitch.current = -0.02;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 74;
    cam.updateProjectionMatrix();
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch.current, yaw.current, 0);
    invalidate();
    setWalkWake(invalidate);

    return () => {
      setWalkWake(null);
      walkState.justLeft = true;
      camera.rotation.order = 'XYZ';
      if (document.pointerLockElement) document.exitPointerLock();
      Object.keys(keys.current).forEach((k) => (keys.current[k] = false));
      walkInput.forward = walkInput.back = walkInput.left = walkInput.right = walkInput.run = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard + mouse look
  useEffect(() => {
    const el = gl.domElement;
    // Some synthetic / remote keyboards omit `code`; fall back to `key`.
    const norm = (e: KeyboardEvent) => e.code || (e.key.length === 1 ? `Key${e.key.toUpperCase()}` : e.key);
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      const id = norm(e);
      keys.current[id] = true;
      invalidate(); // frameloop is "demand": a key press must start the render loop
      if (id.startsWith('Arrow') || id === 'Space') e.preventDefault();
    };
    const ku = (e: KeyboardEvent) => {
      keys.current[norm(e)] = false;
    };
    const down = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      if (e.pointerType === 'mouse' && !document.pointerLockElement) {
        try {
          const r = el.requestPointerLock() as unknown as Promise<void> | undefined;
          r?.catch?.(() => undefined);
        } catch {
          /* drag-to-look still works */
        }
      }
    };
    const move = (e: PointerEvent) => {
      let dx = 0;
      let dy = 0;
      if (document.pointerLockElement === el) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (dragging.current) {
        dx = e.clientX - last.current.x;
        dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
      } else return;
      yaw.current -= dx * 0.0032;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0032, -1.25, 1.25);
      invalidate();
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [gl, invalidate]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const k = keys.current;
    const f = (k.KeyW || k.ArrowUp || walkInput.forward ? 1 : 0) - (k.KeyS || k.ArrowDown || walkInput.back ? 1 : 0);
    const s = (k.KeyD || k.ArrowRight || walkInput.right ? 1 : 0) - (k.KeyA || k.ArrowLeft || walkInput.left ? 1 : 0);
    const speed = (k.ShiftLeft || k.ShiftRight || k.Shift || walkInput.run ? RUN : WALK) * dt;

    let dx = 0;
    let dz = 0;
    if (f || s) {
      const len = Math.hypot(f, s);
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      // forward = (-sin, -cos); right = (cos, -sin)
      dx = ((-sin * f + cos * s) / len) * speed;
      dz = ((-cos * f - sin * s) / len) * speed;
    }

    const p = camera.position;
    const shutterDown = !usePharmacyStore.getState().doorOpen;
    const stockClosed = !usePharmacyStore.getState().stockDoorOpen;
    const sd = layout.stock.door;
    const pz0 = -layout.stock.partition.y1; // partition spans z in [pz0, pz1]
    const pz1 = -layout.stock.partition.y0;
    const hit = (x: number, z: number) => {
      // A pulled-down roller shutter blocks the whole front.
      if (shutterDown && z < WALL_THICKNESS + RADIUS && z > -RADIUS && x > -WALL_THICKNESS && x < layout.W + WALL_THICKNESS) return true;
      // A closed back door seals the stock-room doorway.
      if (stockClosed && x > sd.x0 && x < sd.x1 && z > pz0 - RADIUS && z < pz1 + RADIUS) return true;
      for (const b of colliders) {
        const cx = Math.max(b.x0, Math.min(x, b.x1));
        const cz = Math.max(b.z0, Math.min(z, b.z1));
        if ((x - cx) ** 2 + (z - cz) ** 2 < RADIUS * RADIUS) return true;
      }
      return false;
    };
    const nx = p.x + dx;
    if (!hit(nx, p.z)) p.x = nx;
    const nz = p.z + dz;
    if (!hit(p.x, nz)) p.z = nz;

    travelled.current += Math.hypot(dx, dz);
    p.y = EYE + (f || s ? Math.sin(travelled.current * 0.11) * 0.45 : 0);
    camera.rotation.set(pitch.current, yaw.current, 0);
    // frameloop is "demand": keep rendering while moving, plus one frame to settle the head-bob
    if (f || s || wasMoving.current) invalidate();
    wasMoving.current = !!(f || s);
  });

  return null;
}
