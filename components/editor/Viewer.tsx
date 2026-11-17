'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useState, type ReactNode } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { WalkthroughHud } from '@/components/editor/WalkthroughHud';

function Spinner({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#eef1ef]/95 text-[#41524c]" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#cfe0cc] border-t-[#6f9a6a]" />
      <div className="text-[13px] font-medium">{label}</div>
    </div>
  );
}

// The 3D scene is client-only: keep Three.js out of the server render.
const PharmacyScene = dynamic(() => import('@/components/scene/PharmacyScene'), {
  ssr: false,
  loading: () => <Spinner label="Loading 3D engine…" />,
});

class SceneBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow">
            <div className="text-[15px] font-semibold text-[#1d2b27]">The 3D view couldn’t start</div>
            <p className="mt-2 text-[13px] text-[#66766f]">
              Your browser or GPU may not support WebGL 2. Try a current version of Chrome, Edge, Safari or Firefox with hardware
              acceleration enabled.
            </p>
            <button type="button" onClick={() => location.reload()} className="mt-4 rounded-lg bg-[#6f9a6a] px-4 py-2 text-[13px] font-semibold text-white">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Hosts the 3D viewport, loading indicator and the walkthrough overlay. */
export function Viewer() {
  const ready = usePharmacyStore((s) => s.sceneReady);
  const view = usePharmacyStore((s) => s.view);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      setWebgl(false);
    }
  }, []);

  if (!webgl) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-[13px] text-[#66766f]">
        WebGL isn’t available in this browser, so the 3D pharmacy can’t be shown.
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <SceneBoundary>
        <PharmacyScene />
      </SceneBoundary>
      {!ready && <Spinner label="Building the pharmacy…" />}
      {ready && view === 'walkthrough' && <WalkthroughHud />}
      {ready && view !== 'walkthrough' && (
        <div className="pointer-events-none absolute bottom-24 left-3 hidden rounded-lg bg-white/80 px-2.5 py-1.5 text-[11px] leading-snug text-[#5b6a65] shadow-sm backdrop-blur sm:block">
          <b>Drag</b> orbit · <b>Right-drag</b> pan · <b>Scroll</b> zoom · <b>Click</b> a fixture to edit
        </div>
      )}
    </div>
  );
}
