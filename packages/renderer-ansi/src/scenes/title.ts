import type { TitleScene } from '@void-gladiator/game-core';
import {
  RESET,
  BOLD,
  DIM,
  CYAN,
  CYAN_BRIGHT,
  WHITE_BRIGHT,
} from '../colors.js';
import { buildTopBorder, buildBottomBorder } from '../components/ui.js';
import { ARENA_WIDTH } from '@void-gladiator/content';

const TITLE_ART = [
  '╦  ╦╔═╗╦╔╦╗',
  '╚╗╔╝║ ║║ ║║',
  ' ╚╝ ╚═╝╩═╩╝',
  '',
  '╔═╗╦  ╔═╗╔╦╗╦╔═╗╔╦╗╔═╗╦═╗',
  '║ ╦║  ╠═╣ ║║║╠═╣ ║ ║ ║╠╦╝',
  '╚═╝╩═╝╩ ╩═╩╝╩╩ ╩ ╩ ╚═╝╩╚═',
];

/** Strip ANSI codes to get the visible character count. */
const visibleLength = (text: string): number =>
  text.replace(/\x1b\[[0-9;]*m/g, '').length;

/**
 * Wrap content in a bordered row: ║<content padded to width>║
 * Correctly handles ANSI codes when calculating padding.
 */
const borderedRow = (content: string, width: number): string => {
  const visible = visibleLength(content);
  const rightPad = Math.max(0, width - visible);
  return `${DIM}║${RESET}${content}${' '.repeat(rightPad)}${DIM}║${RESET}`;
};

/** Create an empty bordered row. */
const emptyRow = (width: number): string =>
  `${DIM}║${' '.repeat(width)}║${RESET}`;

/** Center text visually within a width, returning padded string. */
const centerInWidth = (text: string, width: number): string => {
  const visible = visibleLength(text);
  const leftPad = Math.max(0, Math.floor((width - visible) / 2));
  return ' '.repeat(leftPad) + text;
};

/**
 * Render the title screen.
 */
export const renderTitle = (state: TitleScene): string => {
  const width = ARENA_WIDTH;
  const rows: string[] = [];

  rows.push('');
  rows.push(buildTopBorder(width));
  rows.push(emptyRow(width));
  rows.push(emptyRow(width));

  // Title art — gentle color pulse between cyan shades
  const titleColor = state.animationTick % 90 < 45 ? CYAN_BRIGHT : CYAN;
  for (const line of TITLE_ART) {
    if (line === '') {
      rows.push(emptyRow(width));
    } else {
      const colored = `${titleColor}${BOLD}${line}${RESET}`;
      rows.push(borderedRow(centerInWidth(colored, width), width));
    }
  }

  rows.push(emptyRow(width));
  rows.push(emptyRow(width));

  // Subtitle
  const subtitle = `${DIM}A terminal arena shooter${RESET}`;
  rows.push(borderedRow(centerInWidth(subtitle, width), width));

  rows.push(emptyRow(width));
  rows.push(emptyRow(width));

  // Prompt — gentle pulse between bright and dim (never disappears)
  const promptCycle = state.animationTick % 60;
  const promptColor = promptCycle < 40 ? `${WHITE_BRIGHT}${BOLD}` : DIM;
  const prompt = `${promptColor}Press SPACE to start${RESET}`;
  rows.push(borderedRow(centerInWidth(prompt, width), width));

  rows.push(emptyRow(width));
  rows.push(buildBottomBorder(width));
  rows.push('');

  return rows.join('\n');
};
