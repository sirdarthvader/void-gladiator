export const GAME_TITLE = 'Void Gladiator';
export const ARENA_WIDTH = 50;
export const ARENA_HEIGHT = 20;
export const MAX_PLAYERS = 4;

// Player defaults
export const PLAYER_MAX_HEALTH = 5;
export const PLAYER_FIRE_COOLDOWN_TICKS = 6; // ~200ms at 30Hz

// Projectile constants
export const PROJECTILE_SPEED = 2; // cells per tick
export const PROJECTILE_LIFETIME_TICKS = 30; // ~1 second at 30Hz

// Enemy definitions
export type EnemyKind = 'shardling';

export interface EnemyDefinition {
  kind: EnemyKind;
  glyph: string;
  health: number;
  speed: number; // cells per tick (can be fractional)
  damage: number;
  scoreValue: number;
}

export const ENEMY_DEFINITIONS: Record<EnemyKind, EnemyDefinition> = {
  shardling: {
    kind: 'shardling',
    glyph: 's',
    health: 1,
    speed: 0.15,
    damage: 1,
    scoreValue: 10,
  },
};

// Sandbox auto-spawn (temporary for milestone 2 testing)
export const SANDBOX_SPAWN_INTERVAL_TICKS = 90; // ~3 seconds at 30Hz
export const SANDBOX_MAX_ENEMIES = 8;
