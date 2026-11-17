import { create } from 'zustand';
import type {
  ObjectId,
  PharmacyConfig,
  ViewId,
  WallId,
  WallMode,
} from '@/types/pharmacy';
import { DEFAULT_CONFIG, computeLayout, normalizeConfig, type Layout } from '@/lib/layout';
import { BASE_WALLS, VIEW_WALLS } from '@/lib/views';

type Walls = Record<WallId, WallMode>;

interface PharmacyState {
  config: PharmacyConfig;
  layout: Layout;

  view: ViewId;
  /** Bumps on every view request so re-clicking the same view re-frames the camera. */
  viewNonce: number;
  walls: Walls;
  cutaway: boolean;

  selectedId: ObjectId | null;
  hoveredId: ObjectId | null;

  showDimensions: boolean;
  doorOpen: boolean;
  sceneReady: boolean;
  leftOpen: boolean;
  rightOpen: boolean;

  setView: (v: ViewId) => void;
  resetView: () => void;
  setWallMode: (w: WallId, m: WallMode) => void;
  setCutaway: (on: boolean) => void;

  patchConfig: <K extends keyof PharmacyConfig>(key: K, patch: Partial<PharmacyConfig[K]>) => void;
  resetConfig: () => void;

  select: (id: ObjectId | null) => void;
  hover: (id: ObjectId | null) => void;

  toggleDimensions: () => void;
  toggleDoor: () => void;
  setDoorOpen: (open: boolean) => void;
  setSceneReady: (r: boolean) => void;
  setLeftOpen: (o: boolean) => void;
  setRightOpen: (o: boolean) => void;
}

const initialConfig = normalizeConfig(DEFAULT_CONFIG);

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  config: initialConfig,
  layout: computeLayout(initialConfig),

  view: 'perspective',
  viewNonce: 0,
  walls: { ...VIEW_WALLS.perspective },
  cutaway: false,

  selectedId: null,
  hoveredId: null,

  showDimensions: false,
  doorOpen: true, // the shopfront opens fully by default
  sceneReady: false,
  leftOpen: true,
  rightOpen: true,

  setView: (view) =>
    set((s) => ({
      view,
      viewNonce: s.viewNonce + 1,
      walls: { ...VIEW_WALLS[view] },
      cutaway: false,
      hoveredId: null,
      selectedId: view === 'walkthrough' ? null : s.selectedId,
      // Free the viewport on small screens while walking.
      leftOpen: view === 'walkthrough' ? false : s.leftOpen,
      rightOpen: view === 'walkthrough' ? false : s.rightOpen,
    })),

  resetView: () =>
    set((s) => ({
      view: 'perspective',
      viewNonce: s.viewNonce + 1,
      walls: { ...VIEW_WALLS.perspective },
      cutaway: false,
    })),

  setWallMode: (w, m) => set((s) => ({ walls: { ...s.walls, [w]: m }, cutaway: false })),

  setCutaway: (on) =>
    set((s) => ({
      cutaway: on,
      walls: on
        ? { front: 'hidden', back: 'hidden', left: 'hidden', right: 'hidden', ceiling: 'hidden' }
        : { ...VIEW_WALLS[s.view === 'walkthrough' ? 'perspective' : s.view] },
    })),

  patchConfig: (key, patch) => {
    const next = normalizeConfig({
      ...get().config,
      [key]: { ...get().config[key], ...patch },
    });
    set({ config: next, layout: computeLayout(next) });
  },

  resetConfig: () => {
    const next = normalizeConfig(DEFAULT_CONFIG);
    set({ config: next, layout: computeLayout(next), selectedId: null });
  },

  select: (selectedId) => set({ selectedId, rightOpen: selectedId ? true : get().rightOpen }),
  hover: (hoveredId) => set({ hoveredId }),

  toggleDimensions: () => set((s) => ({ showDimensions: !s.showDimensions })),
  toggleDoor: () => set((s) => ({ doorOpen: !s.doorOpen })),
  setDoorOpen: (doorOpen) => set({ doorOpen }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setLeftOpen: (leftOpen) => set({ leftOpen }),
  setRightOpen: (rightOpen) => set({ rightOpen }),
}));

export { BASE_WALLS };
