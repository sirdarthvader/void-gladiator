import type { AppState } from '@void-gladiator/game-core';
import { renderTitle } from './scenes/title.js';
import { renderLobby } from './scenes/lobby.js';
import { renderGameplay } from './scenes/gameplay.js';
import { renderResults } from './scenes/results.js';
import { normalizeFrame, computeFrameSize } from './frame-buffer.js';

// Re-export scene renderers for direct use
export { renderTitle } from './scenes/title.js';
export { renderLobby } from './scenes/lobby.js';
export { renderGameplay } from './scenes/gameplay.js';
export { renderResults } from './scenes/results.js';
export {
  normalizeFrame,
  computeFrameSize,
  resetFrameBuffer,
} from './frame-buffer.js';

/**
 * Render any scene — the top-level render dispatcher.
 * Returns a frame buffer clamped to dimensions derived from the arena size,
 * with delta rendering to minimize stdout writes.
 */
export const renderFrame = (state: AppState): string => {
  let raw: string;
  switch (state.scene) {
    case 'title':
      raw = renderTitle(state);
      break;
    case 'lobby':
      raw = renderLobby(state);
      break;
    case 'gameplay':
      raw = renderGameplay(state);
      break;
    case 'results':
      raw = renderResults(state);
      break;
  }
  const { frameWidth, frameHeight } = computeFrameSize(
    state.arenaWidth,
    state.arenaHeight
  );
  return normalizeFrame(raw, frameWidth, frameHeight);
};
