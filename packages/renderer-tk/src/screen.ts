/**
 * ScreenBuffer initialization and terminal lifecycle management.
 *
 * Wraps terminal-kit's ScreenBuffer with game-specific dimensions
 * and provides init/cleanup for the terminal state.
 */

import terminalKit from 'terminal-kit';
import { ARENA_MARGIN_X, ARENA_MARGIN_Y } from '@void-gladiator/content';
import type { ScreenBuffer as ScreenBufferType } from 'terminal-kit';
import type { Sprite } from './types.js';

const term = terminalKit.terminal;
const ScreenBuffer = terminalKit.ScreenBuffer;

// Arena content area offset within the frame buffer
export const ARENA_X_OFFSET = 1; // after left border
export const ARENA_Y_OFFSET = 2; // after HUD row + top border

export interface Screen {
  buffer: ScreenBufferType;
  width: number;
  height: number;
  arenaWidth: number;
  arenaHeight: number;
}

/**
 * Create the main screen buffer sized for the given arena dimensions.
 */
export const createScreen = (arenaWidth: number, arenaHeight: number): Screen => {
  const width = arenaWidth + ARENA_MARGIN_X;
  const height = arenaHeight + ARENA_MARGIN_Y;

  const buffer = new ScreenBuffer({
    width,
    height,
    dst: term,
    x: 0,
    y: 0,
  });

  return { buffer, width, height, arenaWidth, arenaHeight };
};

/**
 * Enter the game's terminal mode: alt screen, hidden cursor, cleared display.
 */
export const initTerminal = (): void => {
  term.fullscreen(true);
  term.hideCursor();
  term.clear();
};

/**
 * Restore the terminal to its normal state.
 */
export const cleanupTerminal = (): void => {
  term.hideCursor(false);
  term.fullscreen(false);
};

/**
 * Flush the screen buffer to the terminal using delta rendering.
 */
export const flushScreen = (screen: Screen): void => {
  screen.buffer.draw({ delta: true });
};

/**
 * Force a full redraw on the next flush (e.g., after a scene change).
 */
export const forceFullRedraw = (screen: Screen): void => {
  screen.buffer.draw();
};

/**
 * Fill the entire screen buffer with a default background.
 */
export const clearScreen = (screen: Screen): void => {
  screen.buffer.fill({
    attr: { color: 'white', bgColor: 'black' },
    char: ' ',
  });
};

/**
 * Put a single character at (x, y) with attributes.
 */
export const putCell = (
  screen: Screen,
  x: number,
  y: number,
  char: string,
  attr: ScreenBufferType.Attributes
): void => {
  if (x < 0 || x >= screen.width || y < 0 || y >= screen.height) return;
  screen.buffer.put({ x, y, attr, wrap: false, dx: 1, dy: 0 }, char);
};

/**
 * Put a string at (x, y) with attributes.
 */
export const putText = (
  screen: Screen,
  x: number,
  y: number,
  text: string,
  attr: ScreenBufferType.Attributes
): void => {
  if (y < 0 || y >= screen.height) return;
  screen.buffer.put({ x, y, attr, wrap: false, dx: 1, dy: 0 }, text);
};

/**
 * Draw a sprite at entity position, mapping the sprite's origin
 * to the entity's arena coordinates (with arena offsets applied).
 */
export const drawSprite = (
  screen: Screen,
  sprite: Sprite,
  arenaX: number,
  arenaY: number,
  colorOverride?: string
): void => {
  const baseX = arenaX + ARENA_X_OFFSET - sprite.originX;
  const baseY = arenaY + ARENA_Y_OFFSET - sprite.originY;

  for (let row = 0; row < sprite.height; row++) {
    for (let col = 0; col < sprite.width; col++) {
      const cell = sprite.cells[row]?.[col];
      if (!cell) continue;

      const x = baseX + col;
      const y = baseY + row;

      if (x < ARENA_X_OFFSET || x >= ARENA_X_OFFSET + screen.arenaWidth) continue;
      if (y < ARENA_Y_OFFSET || y >= ARENA_Y_OFFSET + screen.arenaHeight) continue;

      const attr: ScreenBufferType.Attributes = {
        color: cell.color ?? colorOverride ?? 'white',
        bgColor: cell.bgColor ?? 232,
        bold: cell.bold,
        dim: cell.dim,
      };

      putCell(screen, x, y, cell.char, attr);
    }
  }
};
