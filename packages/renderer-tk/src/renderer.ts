/**
 * Enhanced renderer factory — creates a Renderer that uses
 * terminal-kit's ScreenBuffer for cell-level delta rendering.
 */

import type { AppState } from '@void-gladiator/game-core';
import type { Renderer } from './types.js';
import type { Screen } from './screen.js';
import {
  createScreen,
  initTerminal,
  cleanupTerminal,
  flushScreen,
  forceFullRedraw,
} from './screen.js';
import { renderGameplay } from './scenes/gameplay.js';
import { renderTitle } from './scenes/title.js';
import { renderLobby } from './scenes/lobby.js';
import { renderResults } from './scenes/results.js';

/**
 * Create an enhanced terminal-kit renderer.
 */
export const createEnhancedRenderer = (): Renderer => {
  let screen: Screen | null = null;
  let prevScene = '';
  let prevWidth = 0;
  let prevHeight = 0;

  const ensureScreen = (arenaWidth: number, arenaHeight: number): Screen => {
    if (!screen || arenaWidth !== prevWidth || arenaHeight !== prevHeight) {
      screen = createScreen(arenaWidth, arenaHeight);
      prevWidth = arenaWidth;
      prevHeight = arenaHeight;
    }
    return screen;
  };

  return {
    init() {
      initTerminal();
    },

    render(state: AppState) {
      const s = ensureScreen(state.arenaWidth, state.arenaHeight);

      // Force full redraw on scene change
      const needsFullRedraw = state.scene !== prevScene;
      prevScene = state.scene;

      switch (state.scene) {
        case 'title':
          renderTitle(state, s);
          break;
        case 'lobby':
          renderLobby(state, s);
          break;
        case 'gameplay':
          renderGameplay(state, s);
          break;
        case 'results':
          renderResults(state, s);
          break;
      }

      if (needsFullRedraw) {
        forceFullRedraw(s);
      } else {
        flushScreen(s);
      }
    },

    cleanup() {
      cleanupTerminal();
    },
  };
};
