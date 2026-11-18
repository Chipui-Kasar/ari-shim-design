/**
 * Shared types for the pharmacy designer.
 *
 * UNIT CONVENTION: every dimension in the config and in the 3D scene is in INCHES.
 * 1 scene unit = 1 inch.  Scene axes:  +X = right wall (as seen entering),
 * +Y = up, +Z = towards the street (front wall is at Z = 0, back wall at Z = -length).
 *
 * PLAN CONVENTION (used by the layout engine): x = distance from the LEFT wall,
 * y = distance from the FRONT wall (entrance).  Scene position = (x, h, -y).
 */

export type ObjectId =
  | 'cosmetics'
  | 'rxRacks'
  | 'otcRacks'
  | 'backCabinets'
  | 'counter'
  | 'door'
  | 'stockRoom';

export type ViewId = 'perspective' | 'top' | 'front' | 'left' | 'right' | 'walkthrough';

export type WallId = 'front' | 'back' | 'left' | 'right' | 'ceiling' | 'partition';
export type WallMode = 'visible' | 'ghost' | 'hidden';

export type MaterialId =
  | 'oakNatural'
  | 'oakLight'
  | 'walnut'
  | 'matteWhite'
  | 'sage'
  | 'lightGrey'
  | 'aluminium'
  | 'charcoal';

export type QualityLevel = 'low' | 'medium' | 'high';

export interface RoomConfig {
  width: number;
  /** Length of the SHOP (front wall to the stock-room partition). */
  length: number;
  height: number;
  /** Depth of the stock & rest room behind the shop, partition wall included. */
  stockDepth: number;
}

export interface FinishConfig {
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  tileSize: number;
}

export interface CosmeticsConfig {
  depth: number;
  plinth: number;
  topHeight: number;
  spacing: number;
  material: MaterialId;
  tint: string | null;
  glassSections: number;
}

export interface MedicineConfig {
  rackDepth: number;
  rackHeight: number;
  spacing: number;
  material: MaterialId;
  tint: string | null;
}

export interface BackCabinetConfig {
  depth: number;
  height: number;
  material: MaterialId;
  tint: string | null;
}

export interface CounterConfig {
  /** Length of the leg that runs along the right wall (from the front wall). */
  sideLength: number;
  /** Length of the leg that runs across the front (from the right wall). */
  frontLength: number;
  depth: number;
  height: number;
  material: MaterialId;
  tint: string | null;
}

/** The roller shutter that closes the open shopfront. */
export interface DoorConfig {
  /** Opening height under the fascia beam. */
  height: number;
  /** Guide-rail / bottom-bar finish. */
  frame: MaterialId;
}

export interface LightingConfig {
  intensity: number;
  /** Colour temperature in Kelvin. */
  temperature: number;
  downlights: boolean;
  shelfLeds: boolean;
  cove: boolean;
  counterLight: boolean;
  quality: QualityLevel;
}

export interface PharmacyConfig {
  room: RoomConfig;
  finishes: FinishConfig;
  cosmetics: CosmeticsConfig;
  medicine: MedicineConfig;
  backCabinets: BackCabinetConfig;
  counter: CounterConfig;
  door: DoorConfig;
  lighting: LightingConfig;
}

export interface CheckResult {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  detail: string;
}
