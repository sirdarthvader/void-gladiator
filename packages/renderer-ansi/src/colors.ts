import chalk from 'chalk';

// ── Chalk style helpers ──────────────────────────────────────────────
// These replace the raw ANSI escape codes with chalk-based functions.

export const bold = chalk.bold;
export const dim = chalk.dim;
export const red = chalk.red;
export const green = chalk.green;
export const yellow = chalk.yellow;
export const cyan = chalk.cyan;
export const whiteBright = chalk.whiteBright;
export const cyanBright = chalk.cyanBright;

/**
 * Apply a named color to text.
 * Used by renderers to colorize player visuals from the content package,
 * which stores color as a renderer-agnostic string name.
 */
const CHALK_COLORS: Record<string, (text: string) => string> = {
  red: chalk.red,
  green: chalk.green,
  yellow: chalk.yellow,
  blue: chalk.blue,
  magenta: chalk.magenta,
  cyan: chalk.cyan,
  white: chalk.white,
};

export const colorize = (color: string, text: string): string =>
  (CHALK_COLORS[color] ?? chalk.white)(text);

// ── Border characters (ASCII-safe, guaranteed 1-cell width) ──────────
export const BOX_TOP_LEFT = '+';
export const BOX_TOP_RIGHT = '+';
export const BOX_BOTTOM_LEFT = '+';
export const BOX_BOTTOM_RIGHT = '+';
export const BOX_HORIZONTAL = '-';
export const BOX_VERTICAL = '|';

// Projectile glyphs. Box-drawing chars have East Asian "Ambiguous" width,
// but most terminals render the box-drawing block at 1 cell.
export const PROJ_HORIZONTAL = '─';
export const PROJ_VERTICAL = '│';
