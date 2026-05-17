/**
 * Screen-level visual effects — shake, flash, and hit markers.
 *
 * These are transient effects that modify how the frame is drawn
 * without affecting the game simulation.
 */

import type { ScreenShake, ScreenFlash, HitMarker } from './render-state.js';

// ── Screen shake ─────────────────────────────────────────────────────

/**
 * Trigger or intensify screen shake.
 * If already shaking, adds to the intensity rather than replacing.
 */
export const triggerShake = (
  current: ScreenShake | null,
  intensity: number
): ScreenShake => {
  const base = current?.remaining ?? 0;
  const totalIntensity = Math.min(
    (current?.intensity ?? 0) + intensity,
    4
  );
  return {
    offsetX: 0,
    offsetY: 0,
    intensity: totalIntensity,
    remaining: Math.max(base, intensity * 2 + 2),
  };
};

/**
 * Advance shake by one tick — compute new random offset and decay.
 */
export const updateShake = (shake: ScreenShake | null): ScreenShake | null => {
  if (!shake || shake.remaining <= 0) return null;

  const t = shake.remaining / (shake.intensity * 2 + 2); // 1→0 decay factor
  const mag = Math.ceil(shake.intensity * t);

  return {
    ...shake,
    offsetX: Math.round((Math.random() * 2 - 1) * mag),
    offsetY: Math.round((Math.random() * 2 - 1) * Math.max(1, mag * 0.5)),
    remaining: shake.remaining - 1,
  };
};

// ── Screen flash ─────────────────────────────────────────────────────

/**
 * Trigger a brief color flash overlay.
 */
export const triggerFlash = (
  color: string,
  duration: number
): ScreenFlash => ({ color, remaining: duration });

/**
 * Advance flash by one tick.
 */
export const updateFlash = (flash: ScreenFlash | null): ScreenFlash | null => {
  if (!flash || flash.remaining <= 0) return null;
  return { ...flash, remaining: flash.remaining - 1 };
};

// ── Hit markers ──────────────────────────────────────────────────────

/**
 * Advance all hit markers — float upward and decrement life.
 */
export const updateHitMarkers = (markers: HitMarker[]): HitMarker[] => {
  const alive: HitMarker[] = [];

  for (const m of markers) {
    const next: HitMarker = {
      ...m,
      y: m.y - 0.3, // float upward
      life: m.life - 1,
    };
    if (next.life > 0) {
      alive.push(next);
    }
  }

  return alive;
};

// ── Combined update ──────────────────────────────────────────────────

/**
 * Update all screen-level effects in one call.
 */
export const updateEffects = (
  hitMarkers: HitMarker[],
  shake: ScreenShake | null,
  flash: ScreenFlash | null
): {
  hitMarkers: HitMarker[];
  shake: ScreenShake | null;
  flash: ScreenFlash | null;
} => ({
  hitMarkers: updateHitMarkers(hitMarkers),
  shake: updateShake(shake),
  flash: updateFlash(flash),
});
