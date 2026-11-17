/** Unit helpers. The whole app works in inches; feet-and-inches is the display default. */

export const IN_PER_FT = 12;

/** 108 -> 9'-0"   20 -> 1'-8"   10.5 -> 0'-10½" */
export function formatFeetInches(totalInches: number): string {
  const sign = totalInches < 0 ? '-' : '';
  const v = Math.abs(Math.round(totalInches * 2) / 2);
  const ft = Math.floor(v / 12);
  const inch = v - ft * 12;
  const whole = Math.floor(inch);
  const half = inch - whole >= 0.5;
  return `${sign}${ft}'-${whole}${half ? '½' : ''}"`;
}

export function formatInches(totalInches: number): string {
  const r = Math.round(totalInches * 10) / 10;
  return `${r}"`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
