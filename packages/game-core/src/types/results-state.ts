import type { GameModeId } from '@void-gladiator/content';

/**
 * Per-player stats displayed at match end.
 */
export interface PlayerResult {
  id: number;
  name: string;
  score: number;
  kills: number;
  deaths: number;
  bestStreak: number;
  roundWins: number;
}

/**
 * Results scene state — shown after a match ends.
 */
export interface ResultsState {
  mode: GameModeId;
  winnerId: number | null;
  players: PlayerResult[];
  displayTick: number;
}
