import type { AppState, ResultsScene } from '../types/app-state.js';
import type { Command } from '@void-gladiator/protocol';
import { createLobbyState } from './lobby.js';

/**
 * Tick the results scene.
 * Waits for player input to transition back to lobby or quit.
 */
export const tickResults = (
  state: ResultsScene,
  commands: readonly Command[]
): AppState => {
  for (const command of commands) {
    if (command === 'rematch' || command === 'return_to_lobby') {
      return {
        scene: 'lobby',
        arenaWidth: state.arenaWidth,
        arenaHeight: state.arenaHeight,
        lobby: createLobbyState(state.results.players.length),
      };
    }
    if (command === 'quit') {
      // Quit is handled at the app shell level, but signal via lobby
      return {
        scene: 'lobby',
        arenaWidth: state.arenaWidth,
        arenaHeight: state.arenaHeight,
        lobby: createLobbyState(state.results.players.length),
      };
    }
  }

  return {
    ...state,
    results: {
      ...state.results,
      displayTick: state.results.displayTick + 1,
    },
  };
};
