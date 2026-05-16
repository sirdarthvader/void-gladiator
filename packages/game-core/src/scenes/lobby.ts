import type { AppState, LobbyScene } from '../types/app-state.js';
import type { LobbyState } from '../types/lobby-state.js';
import type { Command } from '@void-gladiator/protocol';
import { GAME_MODES, GAME_MODE_LIST } from '@void-gladiator/content';
import { createGameplayState } from './gameplay.js';

const COUNTDOWN_TICKS = 90; // 3 seconds at 30Hz

/**
 * Create initial lobby state.
 */
export const createLobbyState = (playerCount: number = 1): LobbyState => {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    ready: false,
  }));

  return {
    players,
    selectedMode: 'void_storm',
    countdown: null,
  };
};

/**
 * Add a player to the lobby. Returns updated state.
 */
export const addPlayerToLobby = (lobby: LobbyState): LobbyState => {
  const mode = GAME_MODES[lobby.selectedMode];
  if (lobby.players.length >= mode.maxPlayers) return lobby;

  const newId = lobby.players.length;
  return {
    ...lobby,
    players: [
      ...lobby.players,
      { id: newId, name: `Player ${newId + 1}`, ready: false },
    ],
  };
};

/**
 * Process a command for a specific player in the lobby.
 */
const processLobbyCommand = (
  lobby: LobbyState,
  playerId: number,
  command: Command
): LobbyState => {
  switch (command) {
    case 'toggle_ready': {
      const players = lobby.players.map((p) =>
        p.id === playerId ? { ...p, ready: !p.ready } : p
      );
      return { ...lobby, players };
    }

    case 'select_mode_next': {
      if (playerId !== 0) return lobby; // only host can change mode
      const currentIdx = GAME_MODE_LIST.indexOf(lobby.selectedMode);
      const nextIdx = (currentIdx + 1) % GAME_MODE_LIST.length;
      return { ...lobby, selectedMode: GAME_MODE_LIST[nextIdx] };
    }

    case 'select_mode_prev': {
      if (playerId !== 0) return lobby; // only host can change mode
      const currentIdx = GAME_MODE_LIST.indexOf(lobby.selectedMode);
      const prevIdx =
        (currentIdx - 1 + GAME_MODE_LIST.length) % GAME_MODE_LIST.length;
      return { ...lobby, selectedMode: GAME_MODE_LIST[prevIdx] };
    }

    default:
      return lobby;
  }
};

/**
 * Tick the lobby scene. Handles readiness, countdown, and transition to gameplay.
 */
export const tickLobby = (
  state: LobbyScene,
  commandsByPlayer: ReadonlyMap<number, readonly Command[]>
): AppState => {
  let lobby = state.lobby;

  // Process commands from each player
  for (const [playerId, commands] of commandsByPlayer) {
    for (const command of commands) {
      lobby = processLobbyCommand(lobby, playerId, command);
    }
  }

  // Check if all players are ready
  const mode = GAME_MODES[lobby.selectedMode];
  const allReady =
    lobby.players.length >= mode.minPlayers &&
    lobby.players.every((p) => p.ready);

  if (allReady && lobby.countdown === null) {
    // Start countdown
    lobby = { ...lobby, countdown: COUNTDOWN_TICKS };
  } else if (!allReady && lobby.countdown !== null) {
    // Cancel countdown if someone un-readies
    lobby = { ...lobby, countdown: null };
  }

  // Tick countdown
  if (lobby.countdown !== null) {
    const nextCountdown = lobby.countdown - 1;
    if (nextCountdown <= 0) {
      // Transition to gameplay
      return {
        scene: 'gameplay',
        arenaWidth: state.arenaWidth,
        arenaHeight: state.arenaHeight,
        gameplay: createGameplayState(
          lobby.selectedMode,
          lobby.players.map((p) => ({ id: p.id, name: p.name })),
          state.arenaWidth,
          state.arenaHeight
        ),
      };
    }
    lobby = { ...lobby, countdown: nextCountdown };
  }

  return { ...state, lobby };
};
