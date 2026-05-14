import type { GameModeId } from '@void-gladiator/content';

/**
 * A player slot in the lobby.
 */
export interface LobbyPlayer {
  id: number;
  name: string;
  ready: boolean;
}

/**
 * Lobby scene state — mode selection and player readiness.
 */
export interface LobbyState {
  players: LobbyPlayer[];
  selectedMode: GameModeId;
  countdown: number | null; // null = not counting, else ticks remaining
}
