/** Mutable input state shared between the on-screen D-pad and the walkthrough controller. */
export const walkInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
};

/** Set when the walkthrough unmounts so the orbit rig re-bases on the walking camera. */
export const walkState = { justLeft: false };
