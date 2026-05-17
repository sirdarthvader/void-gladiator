/**
 * Particle engine — spawn, update, and cull transient visual particles.
 *
 * Particle types:
 *   - Explosion sparks: radial burst when an enemy dies
 *   - Death burst: larger colored burst when a player dies
 *   - Hit sparks: small flash when a player takes damage
 *   - Projectile trails: dim dot left behind moving projectiles
 */

import type { Particle } from './render-state.js';
import type { Projectile } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';

// ── Spawn helpers ────────────────────────────────────────────────────

const SPARK_CHARS = ['*', '+', '.', '`', "'"];
const BURST_CHARS = ['#', '*', '+', 'x', '.'];

const randomPick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const randomRange = (min: number, max: number): number =>
  min + Math.random() * (max - min);

/**
 * Spawn an enemy death explosion — 6-10 outward sparks.
 */
export const spawnExplosion = (
  particles: Particle[],
  x: number,
  y: number,
  color: string
): Particle[] => {
  const count = 6 + Math.floor(Math.random() * 5);
  const newParticles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + randomRange(-0.3, 0.3);
    const speed = randomRange(0.3, 0.8);
    const life = 4 + Math.floor(Math.random() * 5);

    newParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.5, // squash Y for terminal aspect ratio
      life,
      maxLife: life,
      char: randomPick(SPARK_CHARS),
      color,
      bold: Math.random() > 0.5,
    });
  }

  return [...particles, ...newParticles];
};

/**
 * Spawn a player death burst — larger, more particles, player-colored.
 */
export const spawnDeathBurst = (
  particles: Particle[],
  x: number,
  y: number,
  playerId: number
): Particle[] => {
  const visual = PLAYER_VISUALS[playerId % PLAYER_VISUALS.length];
  const count = 12 + Math.floor(Math.random() * 6);
  const newParticles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + randomRange(-0.2, 0.2);
    const speed = randomRange(0.4, 1.2);
    const life = 6 + Math.floor(Math.random() * 8);

    newParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.5,
      life,
      maxLife: life,
      char: randomPick(BURST_CHARS),
      color: visual.color,
      bold: true,
    });
  }

  return [...particles, ...newParticles];
};

/**
 * Spawn hit sparks — small 3-5 particle burst at damage location.
 */
export const spawnHitSparks = (
  particles: Particle[],
  x: number,
  y: number,
  color: string
): Particle[] => {
  const count = 3 + Math.floor(Math.random() * 3);
  const newParticles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(0.2, 0.5);
    const life = 3 + Math.floor(Math.random() * 3);

    newParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.5,
      life,
      maxLife: life,
      char: randomPick(SPARK_CHARS),
      color,
    });
  }

  return [...particles, ...newParticles];
};

/**
 * Spawn faint trail dots behind active projectiles (1 per projectile per frame,
 * with a random chance to skip for visual sparsity).
 */
export const spawnProjectileTrails = (
  particles: Particle[],
  projectiles: readonly Projectile[]
): Particle[] => {
  const newParticles: Particle[] = [];

  for (const proj of projectiles) {
    // 40% chance to emit a trail particle each frame
    if (Math.random() > 0.4) continue;

    const visual = proj.ownerId >= 0
      ? PLAYER_VISUALS[proj.ownerId % PLAYER_VISUALS.length]
      : undefined;

    newParticles.push({
      x: Math.round(proj.x),
      y: Math.round(proj.y),
      vx: 0,
      vy: 0,
      life: 3,
      maxLife: 3,
      char: '.',
      color: visual?.color ?? 'red',
    });
  }

  return newParticles.length > 0 ? [...particles, ...newParticles] : particles;
};

// ── Update ───────────────────────────────────────────────────────────

/**
 * Move all particles, decrement lifetime, and cull dead ones.
 */
export const updateParticles = (particles: Particle[]): Particle[] => {
  const alive: Particle[] = [];

  for (const p of particles) {
    const next: Particle = {
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      life: p.life - 1,
    };
    if (next.life > 0) {
      alive.push(next);
    }
  }

  return alive;
};
