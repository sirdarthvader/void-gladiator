import { ARENA_WIDTH, ARENA_HEIGHT } from '@void-gladiator/content';
import { RESET } from './colors.js';
import { clampToWidth } from './char-width.js';

/**
 * Fixed frame buffer dimensions.
 * All rendered output is clamped to these dimensions to prevent
 * border jitter, flicker, and shifting during screen redraws.
 *
 * Width accounts for the bottom status line text, which is wider than the
 * arena and would otherwise be truncated.
 */
export const FRAME_WIDTH = Math.max(ARENA_WIDTH + 4, 62);
export const FRAME_HEIGHT = ARENA_HEIGHT + 10;

/**
 * Clamp a single line to exactly `width` visible terminal cells.
 * Handles double-width Unicode characters correctly.
 */
const clampLine = (line: string, width: number): string =>
  clampToWidth(line, width, RESET);

/**
 * Normalize a rendered frame to fixed dimensions.
 * - Each row is anchored at column 1 via CUP (absolute positioning)
 * - Each row is clamped/padded to exactly FRAME_WIDTH visible characters
 * - Each row ends with \x1b[K (erase-to-end-of-line) to clear any residual
 *   characters beyond FRAME_WIDTH without the flicker of a full line erase
 * - Total rows are clamped to FRAME_HEIGHT (padded or truncated)
 * - Trailing \x1b[J clears anything below FRAME_HEIGHT
 *
 * \x1b[<n>;1H = move cursor to row n, column 1 (CUP).
 * \x1b[K      = erase from cursor to end of line.
 */
export const normalizeFrame = (raw: string): string => {
  const lines = raw.split('\n');
  const output: string[] = [];

  for (let i = 0; i < FRAME_HEIGHT; i++) {
    const content =
      i < lines.length
        ? clampLine(lines[i], FRAME_WIDTH)
        : ' '.repeat(FRAME_WIDTH);
    output.push(`\x1b[${i + 1};1H${content}\x1b[K`);
  }

  // Clear anything below the frame (in case terminal is taller)
  output.push('\x1b[J');
  return output.join('');
};
