import type { GameplayState } from '../types/gameplay-state.js';
import { DIRECTION_VECTORS } from '@void-gladiator/shared';
import type { Projectile } from '../types/entities.js';

/**
 * Move all projectiles and remove expired / out-of-bounds ones.
 */
export const updateProjectiles = (state: GameplayState): GameplayState => {
  const alive: Projectile[] = [];

  for (const proj of state.projectiles) {
    const vec = DIRECTION_VECTORS[proj.direction];
    const nx = proj.x + vec.x * proj.speed;
    const ny = proj.y + vec.y * proj.speed;
    const remainingLife = proj.lifetime - 1;

    if (
      remainingLife <= 0 ||
      nx < 0 ||
      nx >= state.arenaWidth ||
      ny < 0 ||
      ny >= state.arenaHeight
    ) {
      continue;
    }

    alive.push({ ...proj, x: nx, y: ny, lifetime: remainingLife });
  }

  return { ...state, projectiles: alive };
};
