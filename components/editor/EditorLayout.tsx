'use client';

import { useEffect } from 'react';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { TopBar } from '@/components/editor/TopBar';
import { Sidebar } from '@/components/editor/Sidebar';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { Toolbar } from '@/components/editor/Toolbar';
import { Viewer } from '@/components/editor/Viewer';

/** App shell: top nav, left sidebar, 3D viewport (+ bottom toolbar), right sidebar. */
export default function EditorLayout() {
  const leftOpen = usePharmacyStore((s) => s.leftOpen);
  const rightOpen = usePharmacyStore((s) => s.rightOpen);
  const setLeft = usePharmacyStore((s) => s.setLeftOpen);
  const setRight = usePharmacyStore((s) => s.setRightOpen);

  // Tablets / phones start with the panels tucked away so the viewport has room.
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setLeft(false);
      setRight(false);
    }
  }, [setLeft, setRight]);

  const asideBase =
    'z-30 bg-white border-[#e3e8e5] w-[min(320px,88vw)] shrink-0 absolute inset-y-0 shadow-2xl lg:static lg:shadow-none';

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#eef1ef]">
      <TopBar />
      <div className="relative flex min-h-0 flex-1">
        {leftOpen && (
          <aside className={`${asideBase} left-0 border-r lg:w-[300px]`} aria-label="Design configuration">
            <Sidebar />
          </aside>
        )}

        <main className="relative min-w-0 flex-1">
          <Viewer />
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
            <Toolbar />
          </div>
        </main>

        {rightOpen && (
          <aside className={`${asideBase} right-0 border-l lg:w-[320px]`} aria-label="Selected object properties">
            <PropertiesPanel />
          </aside>
        )}

        {(leftOpen || rightOpen) && (
          <button
            type="button"
            aria-label="Close panels"
            onClick={() => {
              setLeft(false);
              setRight(false);
            }}
            className="absolute inset-0 z-20 bg-black/25 lg:hidden"
          />
        )}
      </div>
    </div>
  );
}
