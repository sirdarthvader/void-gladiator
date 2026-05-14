import {
  RESET,
  DIM,
  BOX_HORIZONTAL,
  BOX_VERTICAL,
  BOX_TOP_LEFT,
  BOX_TOP_RIGHT,
  BOX_BOTTOM_LEFT,
  BOX_BOTTOM_RIGHT,
  GREEN,
  YELLOW,
  RED,
} from '../colors.js';

/**
 * Build a box-drawing top border.
 */
export const buildTopBorder = (width: number): string => {
  return `${DIM}${BOX_TOP_LEFT}${BOX_HORIZONTAL.repeat(width)}${BOX_TOP_RIGHT}${RESET}`;
};

/**
 * Build a box-drawing bottom border.
 */
export const buildBottomBorder = (width: number): string => {
  return `${DIM}${BOX_BOTTOM_LEFT}${BOX_HORIZONTAL.repeat(width)}${BOX_BOTTOM_RIGHT}${RESET}`;
};

/**
 * Left border character.
 */
export const LEFT_BORDER = `${DIM}${BOX_VERTICAL}${RESET}`;

/**
 * Right border character.
 */
export const RIGHT_BORDER = `${DIM}${BOX_VERTICAL}${RESET}`;

/**
 * Build a health bar with filled/empty hearts.
 */
export const buildHealthBar = (health: number, maxHealth: number): string => {
  const filled = '♥'.repeat(Math.max(0, health));
  const empty = '♡'.repeat(Math.max(0, maxHealth - health));
  const color = health > 2 ? GREEN : health > 1 ? YELLOW : RED;
  return `${color}${filled}${DIM}${empty}${RESET}`;
};

/**
 * Build a cooldown/charge bar using block characters.
 */
export const buildBar = (
  current: number,
  max: number,
  segments: number,
  filledColor: string
): string => {
  const filled = Math.round((current / max) * segments);
  const empty = segments - filled;
  return `${filledColor}${'▓'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET}`;
};

/**
 * Center text within a given width.
 */
export const centerText = (text: string, width: number): string => {
  // Strip ANSI for length calculation
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  const pad = Math.max(0, Math.floor((width - stripped.length) / 2));
  return ' '.repeat(pad) + text;
};

/**
 * Pad text to fill a given width (right-padded).
 */
export const padRight = (text: string, width: number): string => {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  const pad = Math.max(0, width - stripped.length);
  return text + ' '.repeat(pad);
};
