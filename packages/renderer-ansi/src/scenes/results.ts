import type { ResultsScene } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';
import { bold, dim, yellow, whiteBright, colorize } from '../colors.js';
import { buildTopBorder, buildBottomBorder } from '../components/ui.js';
import { ARENA_WIDTH } from '@void-gladiator/content';
import { stringWidth, cursorToCol } from '../char-width.js';

const borderedRow = (content: string, width: number): string => {
  const rightPad = Math.max(0, width - stringWidth(content));
  return `${dim('|')}${content}${' '.repeat(rightPad)}${cursorToCol(width + 2)}${dim('|')}`;
};

const emptyRow = (width: number): string =>
  `${dim('|')}${' '.repeat(width)}${cursorToCol(width + 2)}${dim('|')}`;

const centerInWidth = (text: string, width: number): string => {
  const leftPad = Math.max(0, Math.floor((width - stringWidth(text)) / 2));
  return ' '.repeat(leftPad) + text;
};

/**
 * Render the post-match results screen.
 */
export const renderResults = (state: ResultsScene): string => {
  const { results } = state;
  const width = ARENA_WIDTH;
  const rows: string[] = [];

  rows.push('');
  rows.push(buildTopBorder(width));

  // Header
  const header = whiteBright(bold('M A T C H   C O M P L E T E'));
  rows.push(borderedRow(centerInWidth(header, width), width));
  rows.push(emptyRow(width));

  // Winner announcement
  if (results.winnerId !== null) {
    const visual = PLAYER_VISUALS[results.winnerId % PLAYER_VISUALS.length];
    const winnerLine = `${yellow(bold('★ WINNER: '))}${colorize(visual.color, `${visual.glyph} Player ${results.winnerId + 1}`)} ${yellow(bold('★'))}`;
    rows.push(borderedRow(centerInWidth(winnerLine, width), width));
  } else {
    const teamLine = dim(
      `Team eliminated at Wave ${results.players[0]?.score ?? 0}`
    );
    rows.push(borderedRow(centerInWidth(teamLine, width), width));
  }

  rows.push(emptyRow(width));

  // Player stats table header
  const tableHeader = dim('   Player      Score   Kills  Deaths  Streak');
  rows.push(borderedRow(tableHeader, width));
  rows.push(
    `${dim('|' + '-'.repeat(width))}${cursorToCol(width + 2)}${dim('|')}`
  );

  // Player rows (sorted by score descending)
  const sorted = [...results.players].sort((a, b) => b.score - a.score);
  for (const player of sorted) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];
    const glyph = colorize(visual.color, visual.glyph);
    const name = `P${player.id + 1}`.padEnd(10);
    const score = String(player.score).padStart(6);
    const kills = String(player.kills).padStart(6);
    const deaths = String(player.deaths).padStart(7);
    const streak = String(player.bestStreak).padStart(7);
    const line = `   ${glyph} ${name}${score}${kills}${deaths}${streak}`;
    rows.push(borderedRow(line, width));
  }

  rows.push(emptyRow(width));
  rows.push(emptyRow(width));

  // Instructions
  const instrLine = dim('R: rematch │ Q: quit');
  rows.push(borderedRow(centerInWidth(instrLine, width), width));

  rows.push(emptyRow(width));
  rows.push(buildBottomBorder(width));
  rows.push('');

  return rows.join('\n');
};
