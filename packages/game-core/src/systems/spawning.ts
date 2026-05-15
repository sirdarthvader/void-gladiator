import type { GameplayState } from '../types/gameplay-state.js';
import type { Enemy } from '../types/entities.js';
import type { EnemyKind } from '@void-gladiator/content';
import {
  ENEMY_DEFINITIONS,
  SANDBOX_MAX_ENEMIES,
  SANDBOX_SPAWN_INTERVAL_TICKS,
} from '@void-gladiator/content';

/**
 * Spawn an enemy of a given kind at a random arena edge.
 */
export const spawnEnemy = (
  state: GameplayState,
  kind: EnemyKind
): GameplayState => {
  const def = ENEMY_DEFINITIONS[kind];
  const edge = Math.floor(Math.random() * 4);
  let x: number;
  let y: number;

  switch (edge) {
    case 0: // top
      x = Math.floor(Math.random() * (state.arenaWidth - 1));
      y = 0;
      break;
    case 1: // bottom
      x = Math.floor(Math.random() * (state.arenaWidth - 1));
      y = state.arenaHeight - 1;
      break;
    case 2: // left
      x = 0;
      y = Math.floor(Math.random() * state.arenaHeight);
      break;
    default: // right
      x = state.arenaWidth - 2;
      y = Math.floor(Math.random() * state.arenaHeight);
      break;
  }

  const enemy: Enemy = {
    id: state.nextEntityId,
    x,
    y,
    kind: def.kind,
    glyph: def.glyph,
    health: def.health,
    speed: def.speed,
    damage: def.damage,
    moveAccumulator: 0,
    targetPlayerId: 0,
  };

  return {
    ...state,
    enemies: [...state.enemies, enemy],
    nextEntityId: state.nextEntityId + 1,
  };
};

/**
 * Sandbox auto-spawner for testing. Spawns enemies on a timer.
 */
export const sandboxAutoSpawn = (state: GameplayState): GameplayState => {
  const nextTimer = state.spawnTimer - 1;

  if (nextTimer > 0 || state.enemies.length >= SANDBOX_MAX_ENEMIES) {
    return {
      ...state,
      spawnTimer: nextTimer > 0 ? nextTimer : state.spawnTimer,
    };
  }

  const spawned = spawnEnemy(state, 'shardling');
  return { ...spawned, spawnTimer: SANDBOX_SPAWN_INTERVAL_TICKS };
};
