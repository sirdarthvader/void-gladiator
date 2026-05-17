/**
 * Enhanced title scene renderer — starfield background, pulsing title,
 * animated prompt.
 */

import type { TitleScene } from '@void-gladiator/game-core';
import type { Screen } from '../screen.js';
import type { StarfieldState } from '../ambience.js';
import { getStarVisual } from '../ambience.js';
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

// Color cycle for title glow effect (256-color indices: dark cyan → bright cyan → white)
const TITLE_COLORS = [30, 37, 44, 51, 87, 123, 159, 195, 231, 195, 159, 123, 87, 51, 44, 37];

/**
 * Render the title scene onto the screen buffer.
 */
export const renderTitle = (
  state: TitleScene,
  screen: Screen,
  starfield: StarfieldState | null
): void => {
  clearScreen(screen);

  const width = state.arenaWidth;
  const boxTop = 1;
  const boxBottom = screen.height - 2;
  const boxLeft = 0;
  const boxRight = width + 1;

  // ── Starfield background ──────────────────────────────────────────
  if (starfield) {
    for (const star of starfield.stars) {
      const sx = star.x + ARENA_X_OFFSET;
      const sy = star.y + boxTop + 1;
      if (sx > boxLeft && sx < boxRight && sy > boxTop && sy < boxBottom) {
        const vis = getStarVisual(star, state.animationTick);
        putCell(screen, sx, sy, vis.char, {
          color: vis.color,
          bgColor: 'black',
        });
      }
    }
  }

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

  // ── Title text with color cycling glow ────────────────────────────
  const centerY = Math.floor((boxTop + boxBottom) / 2) - 3;
  const colorIdx = Math.floor(state.animationTick / 3) % TITLE_COLORS.length;

  for (let i = 0; i < TITLE_ART.length; i++) {
    const line = TITLE_ART[i];
    if (!line) continue;
    const x = ARENA_X_OFFSET + Math.floor((width - line.length) / 2);

    // Each character gets a slightly offset color for a wave effect
    for (let c = 0; c < line.length; c++) {
      if (line[c] === ' ') continue;
      const ci = (colorIdx + Math.floor(c / 2)) % TITLE_COLORS.length;
      putCell(screen, x + c, centerY + i, line[c], {
        color: TITLE_COLORS[ci],
        bgColor: 'black',
        bold: true,
      });
    }
  }

  // ── Subtitle ──────────────────────────────────────────────────────
  const subX = ARENA_X_OFFSET + Math.floor((width - SUBTITLE.length) / 2);
  putText(screen, subX, centerY + TITLE_ART.length + 1, SUBTITLE, {
    color: 240,
    bgColor: 'black',
  });

  // ── Prompt — pulsing brightness ───────────────────────────────────
  const bright = state.animationTick % 60 < 30;
  const promptX = ARENA_X_OFFSET + Math.floor((width - PROMPT.length) / 2);
  putText(screen, promptX, centerY + TITLE_ART.length + 4, PROMPT, {
    color: bright ? 'white' : 240,
    bgColor: 'black',
    bold: bright,
  });
};
