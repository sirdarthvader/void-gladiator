/**
 * 256-color palette utilities — gradients for health bars, energy,
 * atmosphere, and other visual elements that benefit from smooth
 * color transitions beyond the basic 16 ANSI colors.
 */

// ── Health bar gradient (green → yellow → red) ──────────────────────

const HEALTH_GRADIENT_256 = [196, 202, 208, 214, 220, 226, 190, 154, 118, 82, 46];

/**
 * Get a 256-color index for a health ratio (0→1).
 * 0 = deep red, 1 = bright green.
 */
export const healthGradient256 = (ratio: number): number => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const idx = Math.floor(clamped * (HEALTH_GRADIENT_256.length - 1));
  return HEALTH_GRADIENT_256[idx];
};

// ── Energy/charge gradient (dark blue → bright cyan) ────────────────

const ENERGY_GRADIENT = [17, 18, 19, 20, 21, 27, 33, 39, 45, 51, 87, 123];

/**
 * Get a 256-color index for an energy/charge ratio (0→1).
 */
export const energyGradient256 = (ratio: number): number => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const idx = Math.floor(clamped * (ENERGY_GRADIENT.length - 1));
  return ENERGY_GRADIENT[idx];
};

// ── Fire/explosion gradient (dark red → orange → yellow → white) ────

const FIRE_GRADIENT = [52, 88, 124, 160, 196, 202, 208, 214, 220, 226, 231];

/**
 * Get a 256-color index for fire/explosion intensity (0→1).
 */
export const fireGradient256 = (ratio: number): number => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const idx = Math.floor(clamped * (FIRE_GRADIENT.length - 1));
  return FIRE_GRADIENT[idx];
};

// ── Void/atmosphere gradient (deep black → dark purple → gray) ──────

const VOID_GRADIENT = [232, 233, 234, 235, 53, 54, 55, 236, 237, 238];

/**
 * Get a 256-color index for void/atmosphere depth (0→1).
 */
export const voidGradient256 = (ratio: number): number => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const idx = Math.floor(clamped * (VOID_GRADIENT.length - 1));
  return VOID_GRADIENT[idx];
};

// ── Streak/combo gradient (white → yellow → orange → red) ───────────

const STREAK_GRADIENT = [231, 230, 229, 228, 227, 226, 220, 214, 208, 202, 196];

/**
 * Get a 256-color for streak/combo multiplier display (0→1).
 */
export const streakGradient256 = (ratio: number): number => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const idx = Math.floor(clamped * (STREAK_GRADIENT.length - 1));
  return STREAK_GRADIENT[idx];
};

// ── Player color palettes (richer than basic ANSI) ──────────────────

export interface PlayerPalette {
  primary: number;    // main color (256-index)
  bright: number;     // highlighted / bold state
  dim: number;        // damaged / dim state
  trail: number;      // projectile trail color
}

export const PLAYER_PALETTES: PlayerPalette[] = [
  { primary: 44, bright: 51, dim: 30, trail: 37 },   // P1 cyan
  { primary: 164, bright: 201, dim: 127, trail: 170 }, // P2 magenta
  { primary: 220, bright: 226, dim: 178, trail: 221 }, // P3 yellow/gold
  { primary: 40, bright: 46, dim: 28, trail: 34 },    // P4 green
];
