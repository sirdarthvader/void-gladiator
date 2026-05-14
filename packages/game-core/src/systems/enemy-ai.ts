import type { GameplayState } from '../types/gameplay-state.js';
import type { PlayerState } from '../types/entities.js';
import { clamp } from '@void-gladiator/shared';

/**
 * Simple enemy AI: each enemy moves toward its target player.
 * Target selection: nearest alive player.
 */
export const updateEnemyAI = (state: GameplayState): GameplayState => {
  const alivePlayers = state.players.filter((p) => p.status === 'alive');
  if (alivePlayers.length === 0) return state;

  const movedEnemies = state.enemies.map((enemy) => {
    // Pick nearest alive player as target
    const target = findNearestPlayer(enemy.x, enemy.y, alivePlayers);
    if (!target) return enemy;

    const acc = enemy.moveAccumulator + enemy.speed;
    if (acc < 1) {
      return { ...enemy, moveAccumulator: acc, targetPlayerId: target.id };
    }

    const steps = Math.floor(acc);
    let { x, y } = enemy;
    for (let i = 0; i < steps; i++) {
      const dx = target.x - x;
      const dy = target.y - y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        x += dx > 0 ? 1 : -1;
      } else {
        y += dy > 0 ? 1 : -1;
      }
      x = clamp(x, 0, state.arenaWidth - 1);
      y = clamp(y, 0, state.arenaHeight - 1);
    }

    return {
      ...enemy,
      x,
      y,
      moveAccumulator: acc - steps,
      targetPlayerId: target.id,
    };
  });

  return { ...state, enemies: movedEnemies };
};

const findNearestPlayer = (
  x: number,
  y: number,
  players: readonly PlayerState[]
): PlayerState | null => {
  let nearest: PlayerState | null = null;
  let bestDist = Infinity;

  for (const p of players) {
    const dist = Math.abs(p.x - x) + Math.abs(p.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      nearest = p;
    }
  }

  return nearest;
};
