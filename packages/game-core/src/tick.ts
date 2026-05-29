import type { AppState } from './types/app-state.js';
import type { Command, GameCommand } from '@void-gladiator/protocol';
import { tickTitle } from './scenes/title.js';
import { tickLobby } from './scenes/lobby.js';
import { tickGameplay } from './scenes/gameplay.js';
import { tickResults } from './scenes/results.js';
import { tickMatchmaking } from './scenes/matchmaking.js';
import type { MatchmakingNetworkPatch } from './scenes/matchmaking.js';

/**
 * Per-player command input for a single tick.
 */
export interface AppTickInput {
  commandsByPlayer: ReadonlyMap<number, readonly Command[]>;
  matchmakingPatch?: MatchmakingNetworkPatch;
}

/**
 * Top-level tick function — dispatches to the active scene's tick handler.
 * This is the single entry point for advancing the entire application state.
 */
export const tickApp = (state: AppState, input: AppTickInput): AppState => {
  const allCommands = flattenCommands(input.commandsByPlayer);

  switch (state.scene) {
    case 'title':
      return tickTitle(state, allCommands);

    case 'lobby':
      return tickLobby(state, input.commandsByPlayer);

    case 'matchmaking':
      return tickMatchmaking(
        state,
        input.commandsByPlayer,
        input.matchmakingPatch
      );

    case 'gameplay': {
      // Filter to only GameCommand for gameplay
      const gameCommandsByPlayer = filterGameCommands(input.commandsByPlayer);
      return tickGameplay(state, gameCommandsByPlayer);
    }

    case 'results':
      return tickResults(state, allCommands);
  }
};

/**
 * Flatten all player commands into a single array.
 */
const flattenCommands = (
  commandsByPlayer: ReadonlyMap<number, readonly Command[]>
): Command[] => {
  const all: Command[] = [];
  for (const commands of commandsByPlayer.values()) {
    all.push(...commands);
  }
  return all;
};

/**
 * Filter command map to only include GameCommands (exclude SceneCommands from gameplay).
 */
const filterGameCommands = (
  commandsByPlayer: ReadonlyMap<number, readonly Command[]>
): ReadonlyMap<number, readonly GameCommand[]> => {
  const gameCommands = [
    'move_up',
    'move_down',
    'move_left',
    'move_right',
    'fire',
    'dash',
    'special',
    'quit',
  ];
  const filtered = new Map<number, readonly GameCommand[]>();

  for (const [playerId, commands] of commandsByPlayer) {
    const gc = commands.filter((c): c is GameCommand =>
      gameCommands.includes(c)
    );
    if (gc.length > 0) {
      filtered.set(playerId, gc);
    }
  }

  return filtered;
};
