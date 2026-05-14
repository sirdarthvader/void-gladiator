import type { GameModeId } from '@void-gladiator/content';
import type { PlayerState, Projectile, Enemy } from './entities.js';

/**
 * The gameplay scene state — the arena, entities, and match progress.
 * This is what exists during an active game round.
 */
export interface GameplayState {
  arenaWidth: number;
  arenaHeight: number;
  players: PlayerState[];
  projectiles: Projectile[];
  enemies: Enemy[];
  tick: number;
  nextEntityId: number;
  mode: GameModeId;

  // Wave tracking (Void Storm)
  wave: number;
  waveEnemiesRemaining: number;
  waveCleared: boolean;
  waveClearTick: number;

  // Round tracking (Void Duel)
  round: number;
  roundOver: boolean;
  roundWinnerId: number | null;

  // Team lives pool (Void Storm)
  teamLives: number;

  // Match state
  matchOver: boolean;
  matchWinnerId: number | null;

  // Sandbox auto-spawn (temporary)
  spawnTimer: number;
}
