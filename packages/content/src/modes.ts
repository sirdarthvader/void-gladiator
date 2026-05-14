/**
 * Game mode identifiers.
 */
export type GameModeId = 'void_storm' | 'void_duel';

/**
 * Configuration for a game mode — defines the rules that differentiate modes.
 */
export interface GameModeConfig {
  id: GameModeId;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  friendlyFire: boolean;
  /** Number of lives per player (PvP) or shared team lives pool multiplier (PvE) */
  livesPerPlayer: number;
  /** Does this mode use rounds (best-of-N)? */
  hasRounds: boolean;
  roundsToWin: number;
  /** Does the mode have PvE waves? */
  hasWaves: boolean;
  /** Wave enemy count multiplier per additional player */
  waveScalePerPlayer: number;
  /** Can players respawn after death? */
  canRespawn: boolean;
  /** Ticks before respawn (if canRespawn = true) */
  respawnTicks: number;
}

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  void_storm: {
    id: 'void_storm',
    name: 'Void Storm',
    description: 'Co-op survival — fight waves together',
    minPlayers: 1,
    maxPlayers: 4,
    friendlyFire: false,
    livesPerPlayer: 3,
    hasRounds: false,
    roundsToWin: 0,
    hasWaves: true,
    waveScalePerPlayer: 0.4,
    canRespawn: true,
    respawnTicks: 90, // 3 seconds
  },
  void_duel: {
    id: 'void_duel',
    name: 'Void Duel',
    description: 'Free-for-all deathmatch — last standing wins',
    minPlayers: 2,
    maxPlayers: 4,
    friendlyFire: true,
    livesPerPlayer: 3,
    hasRounds: true,
    roundsToWin: 3,
    hasWaves: false,
    waveScalePerPlayer: 0,
    canRespawn: false,
    respawnTicks: 0,
  },
};

export const GAME_MODE_LIST: readonly GameModeId[] = ['void_storm', 'void_duel'];
