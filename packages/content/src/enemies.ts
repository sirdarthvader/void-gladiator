export const PROJECTILE_SPEED = 2; // cells per tick
export const PROJECTILE_LIFETIME_TICKS = 30; // ~1 second at 30Hz

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
    glyph: '◊',
    health: 1,
    speed: 0.15,
    damage: 1,
    scoreValue: 10,
  },
};

// Sandbox auto-spawn (temporary for testing)
export const SANDBOX_SPAWN_INTERVAL_TICKS = 90; // ~3 seconds at 30Hz
export const SANDBOX_MAX_ENEMIES = 8;
