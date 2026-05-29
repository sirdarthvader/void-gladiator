/**
 * Enhanced renderer factory — creates a Renderer that uses
 * terminal-kit's ScreenBuffer for cell-level delta rendering.
 *
 * Manages RenderState (particles/effects), AmbienceState (drift particles),
 * TransitionState (scene change overlays), and VisualConfig (user prefs).
 */

import type { AppState } from '@void-gladiator/game-core';
import type { Renderer } from './types.js';
import type { Screen } from './screen.js';
import type { RenderState } from './render-state.js';
import type { AmbienceState, StarfieldState } from './ambience.js';
import type { TransitionState } from './transitions.js';
import type { VisualConfig } from './visual-config.js';
import { createRenderState, tickRenderState } from './render-state.js';
import { createAmbienceState, tickAmbience, createStarfield } from './ambience.js';
import { startTransition, tickTransition } from './transitions.js';
import { loadVisualConfig } from './visual-config.js';
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
import { renderMatchmaking } from './scenes/matchmaking.js';
import { renderTransitionOverlay } from './scenes/transition-overlay.js';

/**
 * Create an enhanced terminal-kit renderer.
 */
export const createEnhancedRenderer = (): Renderer => {
  let screen: Screen | null = null;
  let prevScene = '';
  let prevWidth = 0;
  let prevHeight = 0;
  let renderState: RenderState = createRenderState();
  let ambience: AmbienceState = createAmbienceState();
  let starfield: StarfieldState | null = null;
  let transition: TransitionState | null = null;
  const config: VisualConfig = loadVisualConfig();

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

      // Detect scene change → reset render state, start transition
      const sceneChanged = state.scene !== prevScene;
      if (sceneChanged) {
        renderState = createRenderState();
        ambience = createAmbienceState();
        if (config.transitions) {
          transition = startTransition(
            state.scene === 'gameplay' ? 'wipe_down' : 'fade_in'
          );
        }
        starfield =
          state.scene === 'title' && config.starfield
            ? createStarfield(state.arenaWidth, state.arenaHeight)
            : null;
      }
      prevScene = state.scene;

      // Tick ambience for gameplay (respects config)
      if (state.scene === 'gameplay' && config.ambience) {
        ambience = tickAmbience(
          ambience,
          state.arenaWidth,
          state.arenaHeight
        );
      }

      switch (state.scene) {
        case 'title':
          renderTitle(state, s, starfield);
          break;
        case 'lobby':
          renderLobby(state, s);
          break;
        case 'matchmaking':
          renderMatchmaking(state, s);
          break;
        case 'gameplay':
          renderState = tickRenderState(renderState, state.gameplay, config);
          renderGameplay(state, s, renderState, ambience);
          break;
        case 'results':
          renderResults(state, s);
          break;
      }

      // Draw transition overlay on top of scene content
      if (transition) {
        renderTransitionOverlay(s, transition);
        transition = tickTransition(transition);
      }

      if (sceneChanged) {
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
