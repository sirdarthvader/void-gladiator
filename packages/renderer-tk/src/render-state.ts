/**
 * Render-only state — tracks particles, screen effects, and hit markers.
 * Completely separate from GameState to preserve simulation determinism.
 *
 * Updated each frame by diffing consecutive GameplayState snapshots
 * to detect visual events (enemy killed, player hit, etc.).
 */

import type { GameplayState } from '@void-gladiator/game-core';
import type { VisualConfig } from './visual-config.js';
import {
  updateParticles,
  spawnExplosion,
  spawnDeathBurst,
  spawnHitSparks,
  spawnProjectileTrails,
} from './particles.js';
import { updateEffects, triggerShake, triggerFlash } from './effects.js';

// ── Types ────────────────────────────────────────────────────────────

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  char: string;
  color: string;
  bold?: boolean;
}

export interface HitMarker {
  x: number;
  y: number;
  life: number;
  char: string;
  color: string;
}

export interface ScreenShake {
  offsetX: number;
  offsetY: number;
  intensity: number;
  remaining: number;
}

export interface ScreenFlash {
  color: string;
  remaining: number;
}

export interface RenderState {
  particles: Particle[];
  hitMarkers: HitMarker[];
  shake: ScreenShake | null;
  flash: ScreenFlash | null;

  // Previous frame snapshot for event detection
  prevEnemyIds: ReadonlySet<number>;
  prevPlayerStatuses: ReadonlyMap<number, string>;
  prevPlayerHealths: ReadonlyMap<number, number>;
  prevProjectileIds: ReadonlySet<number>;
  prevEnemyPositions: ReadonlyMap<number, { x: number; y: number }>;
  prevPlayerPositions: ReadonlyMap<number, { x: number; y: number }>;
}

// ── Create ───────────────────────────────────────────────────────────

export const createRenderState = (): RenderState => ({
  particles: [],
  hitMarkers: [],
  shake: null,
  flash: null,
  prevEnemyIds: new Set(),
  prevPlayerStatuses: new Map(),
  prevPlayerHealths: new Map(),
  prevProjectileIds: new Set(),
  prevEnemyPositions: new Map(),
  prevPlayerPositions: new Map(),
});

// ── Per-frame update ─────────────────────────────────────────────────

const MAX_PARTICLES = 200;

/**
 * Advance the render state by one frame, detecting gameplay events
 * and spawning visual effects accordingly.
 */
export const tickRenderState = (
  rs: RenderState,
  gs: GameplayState,
  config?: VisualConfig
): RenderState => {
  const density = config?.particleDensity ?? 1;
  const noMotion = config?.reducedMotion ?? false;

  let { particles, hitMarkers, shake, flash } = rs;

  // Skip all effect spawning if reduced motion or zero density
  if (noMotion || density === 0) {
    // Still update snapshot so we don't get a burst when re-enabled
    return {
      particles: [],
      hitMarkers: [],
      shake: null,
      flash: null,
      prevEnemyIds: new Set(gs.enemies.map((e) => e.id)),
      prevPlayerStatuses: new Map(gs.players.map((p) => [p.id, p.status])),
      prevPlayerHealths: new Map(gs.players.map((p) => [p.id, p.health])),
      prevProjectileIds: new Set(gs.projectiles.map((p) => p.id)),
      prevEnemyPositions: new Map(
        gs.enemies.map((e) => [e.id, { x: Math.round(e.x), y: Math.round(e.y) }])
      ),
      prevPlayerPositions: new Map(
        gs.players.map((p) => [p.id, { x: p.x, y: p.y }])
      ),
    };
  }

  // ── Detect events by diffing against previous snapshot ───────────

  // Enemies killed — was present last frame, gone now
  const currentEnemyIds = new Set(gs.enemies.map((e) => e.id));
  for (const prevId of rs.prevEnemyIds) {
    if (!currentEnemyIds.has(prevId)) {
      const pos = rs.prevEnemyPositions.get(prevId);
      if (pos) {
        particles = spawnExplosion(particles, pos.x, pos.y, 'red');
        shake = triggerShake(shake, 1);
      }
    }
  }

  // Players killed — status changed to 'dead'
  for (const player of gs.players) {
    const prevStatus = rs.prevPlayerStatuses.get(player.id);
    if (prevStatus === 'alive' && player.status === 'dead') {
      particles = spawnDeathBurst(particles, player.x, player.y, player.id);
      shake = triggerShake(shake, 3);
      flash = triggerFlash('red', 4);
    }
  }

  // Players damaged — health decreased
  for (const player of gs.players) {
    const prevHealth = rs.prevPlayerHealths.get(player.id);
    if (prevHealth !== undefined && player.health < prevHealth && player.status === 'alive') {
      const pos = rs.prevPlayerPositions.get(player.id);
      if (pos) {
        hitMarkers = [
          ...hitMarkers,
          { x: pos.x, y: pos.y - 1, life: 6, char: '!', color: 'red' },
        ];
        particles = spawnHitSparks(particles, pos.x, pos.y, 'yellow');
        flash = triggerFlash('white', 2);
      }
    }
  }

  // Projectile trails for active projectiles
  particles = spawnProjectileTrails(particles, gs.projectiles);

  // ── Update existing effects ──────────────────────────────────────

  particles = updateParticles(particles);
  ({ hitMarkers, shake, flash } = updateEffects(hitMarkers, shake, flash));

  // Cap particle count (scaled by density)
  const maxParticles = Math.floor(MAX_PARTICLES * density);
  if (particles.length > maxParticles) {
    particles = particles.slice(particles.length - maxParticles);
  }

  // ── Save snapshot for next frame ─────────────────────────────────

  const prevEnemyPositions = new Map(
    gs.enemies.map((e) => [e.id, { x: Math.round(e.x), y: Math.round(e.y) }])
  );
  const prevPlayerPositions = new Map(
    gs.players.map((p) => [p.id, { x: p.x, y: p.y }])
  );

  return {
    particles,
    hitMarkers,
    shake,
    flash,
    prevEnemyIds: currentEnemyIds,
    prevPlayerStatuses: new Map(gs.players.map((p) => [p.id, p.status])),
    prevPlayerHealths: new Map(gs.players.map((p) => [p.id, p.health])),
    prevProjectileIds: new Set(gs.projectiles.map((p) => p.id)),
    prevEnemyPositions,
    prevPlayerPositions,
  };
};
