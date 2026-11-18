/** Mutable input state shared between the on-screen D-pad and the walkthrough controller. */
export const walkInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
};

/**
 * The canvas renders on demand, so input that starts movement must schedule a frame.
 * The walkthrough registers its `invalidate` here; the on-screen pad calls `wakeWalk()`.
 */
let wake: (() => void) | null = null;
export const setWalkWake = (fn: (() => void) | null) => {
  wake = fn;
};
export const wakeWalk = () => wake?.();

/** Set when the walkthrough unmounts so the orbit rig re-bases on the walking camera. */
export const walkState = { justLeft: false };
