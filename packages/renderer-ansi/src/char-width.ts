/**
 * Terminal character width utilities.
 *
 * Unicode "East Asian Ambiguous Width" characters render as 2 cells
 * on macOS terminals (Terminal.app, iTerm2). The functions here account
 * for that so visible-width calculations stay correct and borders align.
 *
 * To guarantee border alignment even when tmux disagrees with the terminal
 * about character widths, bordered rows use `cursorToCol()` to force the
 * right border to a fixed column via the ANSI CHA escape (\x1b[nG).
 */

const WIDE_CHARS: ReadonlySet<string> = new Set([
  // Geometric Shapes used as entity glyphs
  '◆',
  '◇',
  '◈',
  '▣',
  '◊',
  // Miscellaneous Symbols
  '♥',
  '♡',
  '★',
  // Dingbats / math symbols
  '✕',
]);

/** Return the terminal cell width of a single character (1 or 2). */
export const charWidth = (ch: string): number => (WIDE_CHARS.has(ch) ? 2 : 1);

/**
 * Skip a CSI escape sequence starting at position `i`.
 * CSI = ESC [ <params> <final byte>, where final byte is 0x40–0x7E.
 * Returns the index after the sequence, or -1 if not a CSI sequence.
 */
const skipCsi = (text: string, i: number): number => {
  if (text[i] !== '\x1b' || i + 1 >= text.length || text[i + 1] !== '[')
    return -1;
  let j = i + 2;
  while (j < text.length && text.charCodeAt(j) < 0x40) j++;
  if (
    j < text.length &&
    text.charCodeAt(j) >= 0x40 &&
    text.charCodeAt(j) <= 0x7e
  ) {
    return j + 1;
  }
  return -1;
};

/** Compute visible cell width of a string, skipping all CSI escapes. */
export const stringWidth = (text: string): number => {
  let width = 0;
  let i = 0;
  while (i < text.length) {
    if (text[i] === '\x1b') {
      const after = skipCsi(text, i);
      if (after !== -1) {
        i = after;
        continue;
      }
      i += 1;
      continue;
    }
    width += charWidth(text[i]);
    i += 1;
  }
  return width;
};

/**
 * Clamp a string to exactly `targetWidth` visible terminal cells.
 * Pads short strings with spaces, truncates long strings.
 * Handles all CSI escapes and double-width characters correctly.
 */
export const clampToWidth = (
  text: string,
  targetWidth: number,
  reset = '\x1b[0m'
): string => {
  const actual = stringWidth(text);

  if (actual === targetWidth) return text;

  if (actual < targetWidth) {
    return `${text}${reset}${' '.repeat(targetWidth - actual)}`;
  }

  // Truncate: walk forward counting visible cell width, skip CSI escapes.
  let width = 0;
  let i = 0;
  while (i < text.length && width < targetWidth) {
    if (text[i] === '\x1b') {
      const after = skipCsi(text, i);
      if (after !== -1) {
        i = after;
        continue;
      }
      i += 1;
      continue;
    }
    const cw = charWidth(text[i]);
    if (width + cw > targetWidth) break;
    width += cw;
    i += 1;
  }

  const gap = targetWidth - width;
  return text.slice(0, i) + reset + (gap > 0 ? ' '.repeat(gap) : '');
};

/** ANSI CHA (Cursor Horizontal Absolute) — move cursor to column `col` (1-indexed). */
export const cursorToCol = (col: number): string => `\x1b[${col}G`;
