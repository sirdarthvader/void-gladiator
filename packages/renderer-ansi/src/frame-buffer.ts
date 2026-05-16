import ansiEscapes from 'ansi-escapes';
import { clampToWidth } from './char-width.js';

// Margins added to the arena for the full frame size.
const FRAME_MARGIN_W = 4; // extra padding beyond arena + borders
const FRAME_MARGIN_H = 10; // HUD, borders, status, padding

/**
 * Compute frame dimensions from arena size.
 */
export const computeFrameSize = (
  arenaWidth: number,
  arenaHeight: number
): { frameWidth: number; frameHeight: number } => ({
  frameWidth: Math.max(arenaWidth + FRAME_MARGIN_W, 62),
  frameHeight: arenaHeight + FRAME_MARGIN_H,
});

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
let prevFrameWidth = 0;
let prevFrameHeight = 0;

/**
 * Reset the delta buffer.
 * Call this when switching scenes or when the terminal is resized
 * to force a full redraw of the next frame.
 */
export const resetFrameBuffer = (): void => {
  prevLines = [];
  prevFrameWidth = 0;
  prevFrameHeight = 0;
};

/**
 * Normalize a rendered frame to fixed dimensions with delta rendering.
 *
 * - Each changed row is anchored at column 1 via CUP (absolute positioning)
 * - Each changed row is clamped/padded to exactly frameWidth visible chars
 * - Each changed row ends with eraseEndOfLine to clear residual characters
 * - Total rows are clamped to frameHeight (padded or truncated)
 * - Unchanged rows are skipped entirely (delta optimization)
 * - On first frame, dimension change, or after reset, all rows are written
 */
export const normalizeFrame = (
  raw: string,
  frameWidth: number,
  frameHeight: number
): string => {
  // Reset delta buffer when dimensions change
  if (frameWidth !== prevFrameWidth || frameHeight !== prevFrameHeight) {
    prevLines = [];
    prevFrameWidth = frameWidth;
    prevFrameHeight = frameHeight;
  }

  const lines = raw.split('\n');
  const output: string[] = [];
  const currentLines: string[] = [];

  for (let i = 0; i < frameHeight; i++) {
    const content =
      i < lines.length
        ? clampLine(lines[i], frameWidth)
        : ' '.repeat(frameWidth);

    currentLines.push(content);

    // Delta: only write lines that differ from the previous frame
    if (content !== prevLines[i]) {
      output.push(
        ansiEscapes.cursorTo(0, i) + content + ansiEscapes.eraseEndLine
      );
    }
  }

  // Clear anything below the frame on first render or if frame shrank
  if (prevLines.length === 0 || prevLines.length > frameHeight) {
    output.push(ansiEscapes.cursorTo(0, frameHeight) + ansiEscapes.eraseDown);
  }

  prevLines = currentLines;
  return output.join('');
};
