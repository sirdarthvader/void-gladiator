import type { TitleScene } from '@void-gladiator/game-core';
import { bold, dim, cyan, whiteBright } from '../colors.js';
import { buildTopBorder, buildBottomBorder } from '../components/ui.js';
import { stringWidth, cursorToCol } from '../char-width.js';

/**
 * Wrap content in a bordered row: ║<content padded to width>║
 * Correctly handles ANSI codes when calculating padding.
 */
const borderedRow = (content: string, width: number): string => {
  const rightPad = Math.max(0, width - stringWidth(content));
  return `${dim('|')}${content}${' '.repeat(rightPad)}${cursorToCol(width + 2)}${dim('|')}`;
};

/** Create an empty bordered row. */
const emptyRow = (width: number): string =>
  `${dim('|')}${' '.repeat(width)}${cursorToCol(width + 2)}${dim('|')}`;

/** Center text visually within a width, returning padded string. */
const centerInWidth = (text: string, width: number): string => {
  const leftPad = Math.max(0, Math.floor((width - stringWidth(text)) / 2));
  return ' '.repeat(leftPad) + text;
};

/**
 * Render the title screen.
 */
export const renderTitle = (_state: TitleScene): string => {
  const width = _state.arenaWidth;
  const rows: string[] = [];

  rows.push('');
  rows.push(buildTopBorder(width));
  rows.push(emptyRow(width));
  rows.push(emptyRow(width));
  rows.push(emptyRow(width));

  // Title — clean spaced text, no ambiguous-width box-drawing chars
  rows.push(borderedRow(centerInWidth(cyan(bold('V  O  I  D')), width), width));
  rows.push(emptyRow(width));
  rows.push(
    borderedRow(centerInWidth(cyan(bold('G L A D I A T O R')), width), width)
  );

  rows.push(emptyRow(width));
  rows.push(emptyRow(width));

  // Subtitle
  rows.push(
    borderedRow(centerInWidth(dim('A terminal arena shooter'), width), width)
  );

  rows.push(emptyRow(width));
  rows.push(emptyRow(width));

  // Prompt — static, no animation
  rows.push(
    borderedRow(
      centerInWidth(whiteBright(bold('Press SPACE to start')), width),
      width
    )
  );

  rows.push(emptyRow(width));
  rows.push(buildBottomBorder(width));
  rows.push('');

  return rows.join('\n');
};
