// Arena
export {
  GAME_TITLE,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  ARENA_MARGIN_X,
  ARENA_MARGIN_Y,
  MAX_PLAYERS,
  isTerminalTooSmall,
} from './arena.js';

// Player
export {
  PLAYER_MAX_HEALTH,
  PLAYER_FIRE_COOLDOWN_TICKS,
  PLAYER_INVINCIBILITY_TICKS,
  PLAYER_RESPAWN_TICKS,
  PLAYER_VISUALS,
} from './player.js';
export type { PlayerVisual } from './player.js';

// Enemies
export {
  ENEMY_DEFINITIONS,
  PROJECTILE_SPEED,
  PROJECTILE_LIFETIME_TICKS,
  SANDBOX_SPAWN_INTERVAL_TICKS,
  SANDBOX_MAX_ENEMIES,
} from './enemies.js';
export type { EnemyKind, EnemyDefinition } from './enemies.js';

// Modes
export { GAME_MODES, GAME_MODE_LIST } from './modes.js';
export type { GameModeId, GameModeConfig } from './modes.js';
