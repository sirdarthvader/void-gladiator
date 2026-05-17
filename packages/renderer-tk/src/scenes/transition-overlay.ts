/**
 * Transition overlay — rendered on top of scene content during scene changes.
 * Supports fade-in (dissolve from black) and wipe-down (reveal rows top to bottom).
 */

import type { Screen } from '../screen.js';
import type { TransitionState } from '../transitions.js';
import { putCell } from '../screen.js';
import { getFadeOpacity, getWipeRow } from '../transitions.js';

const FADE_CHARS = ['#', '%', '+', '.', ' '];

/**
 * Draw a transition overlay on top of the current screen content.
 */
export const renderTransitionOverlay = (
  screen: Screen,
  transition: TransitionState
): void => {
  switch (transition.kind) {
    case 'fade_in':
      renderFadeIn(screen, transition);
      break;
    case 'wipe_down':
      renderWipeDown(screen, transition);
      break;
  }
};

/**
 * Fade-in: randomly placed dark characters that thin out over time.
 */
const renderFadeIn = (screen: Screen, t: TransitionState): void => {
  const opacity = getFadeOpacity(t);
  if (opacity <= 0) return;

  // Use deterministic-ish random based on position + elapsed
  for (let y = 0; y < screen.height; y++) {
    for (let x = 0; x < screen.width; x++) {
      const hash = (x * 31 + y * 17 + t.elapsed * 7) % 100;
      if (hash < opacity * 100) {
        const charIdx = Math.min(
          Math.floor((1 - opacity) * FADE_CHARS.length),
          FADE_CHARS.length - 1
        );
        putCell(screen, x, y, FADE_CHARS[charIdx], {
          color: 232,
          bgColor: 'black',
        });
      }
    }
  }
};

/**
 * Wipe-down: rows below the wipe line are covered in black.
 */
const renderWipeDown = (screen: Screen, t: TransitionState): void => {
  const revealedRows = getWipeRow(t, screen.height);

  for (let y = revealedRows; y < screen.height; y++) {
    for (let x = 0; x < screen.width; x++) {
      putCell(screen, x, y, ' ', { color: 'black', bgColor: 'black' });
    }
  }
};
