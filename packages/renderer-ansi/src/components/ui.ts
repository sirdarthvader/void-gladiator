import {
  dim,
  green,
  yellow,
  red,
  BOX_HORIZONTAL,
  BOX_VERTICAL,
  BOX_TOP_LEFT,
  BOX_TOP_RIGHT,
  BOX_BOTTOM_LEFT,
  BOX_BOTTOM_RIGHT,
} from '../colors.js';
import { stringWidth, cursorToCol } from '../char-width.js';

/**
 * Build a box-drawing top border.
 */
export const buildTopBorder = (width: number): string => {
  return `${dim(BOX_TOP_LEFT + BOX_HORIZONTAL.repeat(width))}${cursorToCol(width + 2)}${dim(BOX_TOP_RIGHT)}`;
};

/**
 * Build a box-drawing bottom border.
 */
export const buildBottomBorder = (width: number): string => {
  return `${dim(BOX_BOTTOM_LEFT + BOX_HORIZONTAL.repeat(width))}${cursorToCol(width + 2)}${dim(BOX_BOTTOM_RIGHT)}`;
};

/**
 * Left border character.
 */
export const LEFT_BORDER = dim(BOX_VERTICAL);

/**
 * Right border character.
 */
export const RIGHT_BORDER = dim(BOX_VERTICAL);

/**
 * Build a health bar with filled/empty hearts.
 */
export const buildHealthBar = (health: number, maxHealth: number): string => {
  const filled = '♥'.repeat(Math.max(0, health));
  const empty = '♡'.repeat(Math.max(0, maxHealth - health));
  const colorFn = health > 2 ? green : health > 1 ? yellow : red;
  return `${colorFn(filled)}${dim(empty)}`;
};

/**
 * Build a cooldown/charge bar using block characters.
 */
export const buildBar = (
  current: number,
  max: number,
  segments: number,
  filledColor: (s: string) => string
): string => {
  const filled = Math.round((current / max) * segments);
  const empty = segments - filled;
  return `${filledColor('▓'.repeat(filled))}${dim('░'.repeat(empty))}`;
};

/**
 * Center text within a given width (strips ANSI for measurement).
 */
export const centerText = (text: string, width: number): string => {
  const pad = Math.max(0, Math.floor((width - stringWidth(text)) / 2));
  return ' '.repeat(pad) + text;
};

/**
 * Pad text to fill a given width, right-padded (strips ANSI for measurement).
 */
export const padRight = (text: string, width: number): string => {
  const pad = Math.max(0, width - stringWidth(text));
  return text + ' '.repeat(pad);
};
