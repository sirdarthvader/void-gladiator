import type { AppState, TitleScene } from '../types/app-state.js';
import type { Command } from '@void-gladiator/protocol';

/**
 * Create the initial title scene state.
 */
export const createTitleState = (
  arenaWidth: number,
  arenaHeight: number
): TitleScene => ({
  scene: 'title',
  arenaWidth,
  arenaHeight,
  animationTick: 0,
});

/**
 * Tick the title scene. Any command transitions to the lobby.
 */
export const tickTitle = (
  state: TitleScene,
  commands: readonly Command[]
): AppState => {
  // Any input transitions to lobby
  const hasInput = commands.some(
    (c) => c === 'confirm' || c === 'fire' || c === 'start_game'
  );

  if (hasInput) {
    return {
      scene: 'lobby',
      arenaWidth: state.arenaWidth,
      arenaHeight: state.arenaHeight,
      lobby: {
        players: [{ id: 0, name: 'Player 1', ready: false }],
        selectedMode: 'void_storm',
        countdown: null,
      },
    };
  }

  return {
    ...state,
    animationTick: state.animationTick + 1,
  };
};
