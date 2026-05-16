/**
 * Enhanced title scene renderer.
 */

import type { TitleScene } from '@void-gladiator/game-core';
import type { Screen } from '../screen.js';
import {
  ARENA_X_OFFSET,
  putCell,
  putText,
  clearScreen,
} from '../screen.js';
import { ATTR_BORDER } from '../colors.js';

// Title art lines — each line is centered within the arena
const TITLE_ART = [
  'V  O  I  D',
  '',
  'G L A D I A T O R',
];

const SUBTITLE = 'A terminal arena shooter';
const PROMPT = 'Press SPACE to start';

/**
 * Render the title scene onto the screen buffer.
 */
export const renderTitle = (state: TitleScene, screen: Screen): void => {
  clearScreen(screen);

  const width = state.arenaWidth;
  const boxTop = 1;
  const boxBottom = screen.height - 2;
  const boxLeft = 0;
  const boxRight = width + 1;

  // ── Box border ────────────────────────────────────────────────────
  putCell(screen, boxLeft, boxTop, '+', ATTR_BORDER);
  putCell(screen, boxRight, boxTop, '+', ATTR_BORDER);
  putCell(screen, boxLeft, boxBottom, '+', ATTR_BORDER);
  putCell(screen, boxRight, boxBottom, '+', ATTR_BORDER);

  for (let x = boxLeft + 1; x < boxRight; x++) {
    putCell(screen, x, boxTop, '-', ATTR_BORDER);
    putCell(screen, x, boxBottom, '-', ATTR_BORDER);
  }
  for (let y = boxTop + 1; y < boxBottom; y++) {
    putCell(screen, boxLeft, y, '|', ATTR_BORDER);
    putCell(screen, boxRight, y, '|', ATTR_BORDER);
  }

  // ── Title text ────────────────────────────────────────────────────
  const centerY = Math.floor((boxTop + boxBottom) / 2) - 3;

  for (let i = 0; i < TITLE_ART.length; i++) {
    const line = TITLE_ART[i];
    if (!line) continue;
    const x = ARENA_X_OFFSET + Math.floor((width - line.length) / 2);
    putText(screen, x, centerY + i, line, {
      color: 'cyan',
      bgColor: 'black',
      bold: true,
    });
  }

  // ── Subtitle ──────────────────────────────────────────────────────
  const subX = ARENA_X_OFFSET + Math.floor((width - SUBTITLE.length) / 2);
  putText(screen, subX, centerY + TITLE_ART.length + 1, SUBTITLE, {
    color: 'white',
    bgColor: 'black',
    dim: true,
  });

  // ── Prompt ────────────────────────────────────────────────────────
  // Animate: pulsing brightness based on tick
  const bright = state.animationTick % 60 < 30;
  const promptX = ARENA_X_OFFSET + Math.floor((width - PROMPT.length) / 2);
  putText(screen, promptX, centerY + TITLE_ART.length + 4, PROMPT, {
    color: 'white',
    bgColor: 'black',
    bold: bright,
    dim: !bright,
  });
};
