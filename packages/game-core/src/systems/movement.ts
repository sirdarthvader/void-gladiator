import type { PlayerState } from '../types/entities.js';
import type { GameCommand } from '@void-gladiator/protocol';
import type { Direction } from '@void-gladiator/shared';
import { clamp, DIRECTION_VECTORS } from '@void-gladiator/shared';

const MOVEMENT_COMMANDS: Record<string, Direction> = {
  move_up: 'up',
  move_down: 'down',
  move_left: 'left',
  move_right: 'right',
};

export interface PlayerInputResult {
  player: PlayerState;
  fireRequested: boolean;
}

/**
 * Resolve a set of game commands into player movement and action triggers.
 */
export const resolvePlayerInput = (
  player: PlayerState,
  commands: readonly GameCommand[],
  arenaWidth: number,
  arenaHeight: number
): PlayerInputResult => {
  let nextPlayer = { ...player };
  let fireRequested = false;

  for (const command of commands) {
    const dir = MOVEMENT_COMMANDS[command];
    if (dir) {
      const vec = DIRECTION_VECTORS[dir];
      nextPlayer = {
        ...nextPlayer,
        x: clamp(nextPlayer.x + vec.x, 0, arenaWidth - 2),
        y: clamp(nextPlayer.y + vec.y, 0, arenaHeight - 1),
        facing: dir,
      };
    } else if (command === 'fire') {
      fireRequested = true;
    }
  }

  return { player: nextPlayer, fireRequested };
};
