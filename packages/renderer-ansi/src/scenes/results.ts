import type { ResultsScene } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';
import { RESET, BOLD, DIM, YELLOW, WHITE_BRIGHT } from '../colors.js';
import { buildTopBorder, buildBottomBorder } from '../components/ui.js';
import { ARENA_WIDTH } from '@void-gladiator/content';
import { stringWidth, cursorToCol } from '../char-width.js';

const borderedRow = (content: string, width: number): string => {
  const rightPad = Math.max(0, width - stringWidth(content));
  return `${DIM}║${RESET}${content}${' '.repeat(rightPad)}${cursorToCol(width + 2)}${DIM}║${RESET}`;
};

const emptyRow = (width: number): string =>
  `${DIM}║${' '.repeat(width)}${cursorToCol(width + 2)}║${RESET}`;

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
  const header = `${WHITE_BRIGHT}${BOLD}M A T C H   C O M P L E T E${RESET}`;
  rows.push(borderedRow(centerInWidth(header, width), width));
  rows.push(emptyRow(width));

  // Winner announcement
  if (results.winnerId !== null) {
    const visual = PLAYER_VISUALS[results.winnerId % PLAYER_VISUALS.length];
    const winnerLine = `${YELLOW}${BOLD}★ WINNER: ${visual.colorCode}${visual.glyph} Player ${results.winnerId + 1}${RESET} ${YELLOW}${BOLD}★${RESET}`;
    rows.push(borderedRow(centerInWidth(winnerLine, width), width));
  } else {
    const teamLine = `${DIM}Team eliminated at Wave ${results.players[0]?.score ?? 0}${RESET}`;
    rows.push(borderedRow(centerInWidth(teamLine, width), width));
  }

  rows.push(emptyRow(width));

  // Player stats table header
  const tableHeader = `${DIM}   Player      Score   Kills  Deaths  Streak${RESET}`;
  rows.push(borderedRow(tableHeader, width));
  rows.push(`${DIM}║${'─'.repeat(width)}${cursorToCol(width + 2)}║${RESET}`);

  // Player rows (sorted by score descending)
  const sorted = [...results.players].sort((a, b) => b.score - a.score);
  for (const player of sorted) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];
    const glyph = `${visual.colorCode}${visual.glyph}${RESET}`;
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
  const instrLine = `${DIM}R: rematch │ Q: quit${RESET}`;
  rows.push(borderedRow(centerInWidth(instrLine, width), width));

  rows.push(emptyRow(width));
  rows.push(buildBottomBorder(width));
  rows.push('');

  return rows.join('\n');
};
