import type { Projectile } from '../types/entities.js';
import type { GameplayState } from '../types/gameplay-state.js';
import {
  PLAYER_FIRE_COOLDOWN_TICKS,
  PROJECTILE_LIFETIME_TICKS,
  PROJECTILE_SPEED,
} from '@void-gladiator/content';
import { DIRECTION_VECTORS } from '@void-gladiator/shared';

/**
 * Spawn a projectile from a player if cooldown allows.
 * Returns updated state with new projectile and player cooldown set.
 */
export const processFireCommand = (
  state: GameplayState,
  playerId: number,
  fireRequested: boolean
): GameplayState => {
  if (!fireRequested) return state;

  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return state;

  const player = state.players[playerIndex];
  if (player.fireCooldown > 0 || player.status !== 'alive') return state;

  const vec = DIRECTION_VECTORS[player.facing];
  const projectile: Projectile = {
    id: state.nextEntityId,
    x: player.x + vec.x,
    y: player.y + vec.y,
    direction: player.facing,
    speed: PROJECTILE_SPEED,
    ownerId: player.id,
    lifetime: PROJECTILE_LIFETIME_TICKS,
  };

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = {
    ...player,
    fireCooldown: PLAYER_FIRE_COOLDOWN_TICKS,
  };

  return {
    ...state,
    players: updatedPlayers,
    projectiles: [...state.projectiles, projectile],
    nextEntityId: state.nextEntityId + 1,
  };
};
