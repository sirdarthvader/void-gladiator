import { ARENA_WIDTH, ARENA_HEIGHT } from '@void-gladiator/content';
import ansiEscapes from 'ansi-escapes';
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
  clampToWidth(line, width);

// ── Delta rendering ──────────────────────────────────────────────────
// Stores the previous frame's clamped line content so we can compare
// and only emit lines that actually changed. This dramatically reduces
// the amount of data written to stdout each tick.

let prevLines: string[] = [];

/**
 * Reset the delta buffer.
 * Call this when switching scenes or when the terminal is resized
 * to force a full redraw of the next frame.
 */
export const resetFrameBuffer = (): void => {
  prevLines = [];
};

/**
 * Normalize a rendered frame to fixed dimensions with delta rendering.
 *
 * - Each changed row is anchored at column 1 via CUP (absolute positioning)
 * - Each changed row is clamped/padded to exactly FRAME_WIDTH visible chars
 * - Each changed row ends with eraseEndOfLine to clear residual characters
 * - Total rows are clamped to FRAME_HEIGHT (padded or truncated)
 * - Unchanged rows are skipped entirely (delta optimization)
 * - On first frame or after reset, all rows are written
 */
export const normalizeFrame = (raw: string): string => {
  const lines = raw.split('\n');
  const output: string[] = [];
  const currentLines: string[] = [];

  for (let i = 0; i < FRAME_HEIGHT; i++) {
    const content =
      i < lines.length
        ? clampLine(lines[i], FRAME_WIDTH)
        : ' '.repeat(FRAME_WIDTH);

    currentLines.push(content);

    // Delta: only write lines that differ from the previous frame
    if (content !== prevLines[i]) {
      output.push(
        ansiEscapes.cursorTo(0, i) + content + ansiEscapes.eraseEndLine
      );
    }
  }

  // Clear anything below the frame on first render or if frame shrank
  if (prevLines.length === 0 || prevLines.length > FRAME_HEIGHT) {
    output.push(ansiEscapes.cursorTo(0, FRAME_HEIGHT) + ansiEscapes.eraseDown);
  }

  prevLines = currentLines;
  return output.join('');
};
