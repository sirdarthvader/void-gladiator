import type { Direction } from '@void-gladiator/shared';
import type { EnemyKind } from '@void-gladiator/content';

// --- Player ---

export type PlayerStatus = 'alive' | 'dead' | 'spectating';

export interface PlayerState {
  id: number;
  x: number;
  y: number;
  glyph: string;
  facing: Direction;
  health: number;
  maxHealth: number;
  fireCooldown: number;
  invincibilityTicks: number;
  status: PlayerStatus;
  respawnTimer: number;
  score: number;
  kills: number;
  deaths: number;
  streak: number;
  streakTimer: number;
  roundWins: number;
}

// --- Projectile ---

export interface Projectile {
  id: number;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  ownerId: number; // playerId, or -1 for enemy
  lifetime: number;
}

// --- Enemy ---

export interface Enemy {
  id: number;
  x: number;
  y: number;
  kind: EnemyKind;
  glyph: string;
  health: number;
  speed: number;
  damage: number;
  moveAccumulator: number;
  targetPlayerId: number;
}
