/**
 * Enhanced results scene renderer.
 */

import type { ResultsScene } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';
import type { Screen } from '../screen.js';
import {
  ARENA_X_OFFSET,
  putCell,
  putText,
  clearScreen,
} from '../screen.js';
import { ATTR_BORDER, ATTR_HUD_DIM, playerAttr } from '../colors.js';

/**
 * Render the results scene onto the screen buffer.
 */
export const renderResults = (state: ResultsScene, screen: Screen): void => {
  const { results } = state;
  clearScreen(screen);

  const width = state.arenaWidth;
  const boxTop = 1;
  const boxBottom = screen.height - 2;
  const boxLeft = 0;
  const boxRight = width + 1;

  // ── Box border ────────────────────────────────────────────────────
  putCell(screen, boxLeft, boxTop, '+', ATTR_BORDER);
  putCell(screen, boxRight, boxTop, '+', ATTR_BORDER);
  putCell(screen, boxLeft, boxBottom, '+', ATTR_BORDER);
  putCell(screen, boxRight, boxBottom, '+', ATTR_BORDER);

  for (let x = boxLeft + 1; x < boxRight; x++) {
    putCell(screen, x, boxTop, '-', ATTR_BORDER);
    putCell(screen, x, boxBottom, '-', ATTR_BORDER);
  }
  for (let y = boxTop + 1; y < boxBottom; y++) {
    putCell(screen, boxLeft, y, '|', ATTR_BORDER);
    putCell(screen, boxRight, y, '|', ATTR_BORDER);
  }

  // ── Header ────────────────────────────────────────────────────────
  const header = 'M A T C H   C O M P L E T E';
  const headerX = ARENA_X_OFFSET + Math.floor((width - header.length) / 2);
  putText(screen, headerX, boxTop + 1, header, {
    color: 'white',
    bgColor: 'black',
    bold: true,
  });

  // ── Winner announcement ───────────────────────────────────────────
  let winnerLine: string;
  let winnerColor: string;

  if (results.winnerId !== null) {
    const visual = PLAYER_VISUALS[results.winnerId % PLAYER_VISUALS.length];
    winnerLine = `* WINNER: ${visual.glyph} Player ${results.winnerId + 1} *`;
    winnerColor = visual.color;
  } else {
    winnerLine = `Team eliminated at Wave ${results.players[0]?.score ?? 0}`;
    winnerColor = 'white';
  }

  const wX = ARENA_X_OFFSET + Math.floor((width - winnerLine.length) / 2);
  putText(screen, wX, boxTop + 3, winnerLine, {
    color: results.winnerId !== null ? 'yellow' : winnerColor,
    bgColor: 'black',
    bold: results.winnerId !== null,
    dim: results.winnerId === null,
  });

  // ── Stats table ───────────────────────────────────────────────────
  const tableY = boxTop + 5;
  const tableHeader = '   Player      Score   Kills  Deaths  Streak';
  putText(screen, ARENA_X_OFFSET + 3, tableY, tableHeader, ATTR_HUD_DIM);

  // Separator line
  for (let x = boxLeft + 1; x < boxRight; x++) {
    putCell(screen, x, tableY + 1, '-', ATTR_BORDER);
  }

  // Player rows sorted by score
  const sorted = [...results.players].sort((a, b) => b.score - a.score);
  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];
    const rowY = tableY + 2 + i;

    // Glyph
    putText(screen, ARENA_X_OFFSET + 3, rowY, visual.glyph, playerAttr(visual.color));

    // Name
    const name = `P${player.id + 1}`;
    putText(screen, ARENA_X_OFFSET + 5, rowY, name.padEnd(10), {
      color: 'white',
      bgColor: 'black',
    });

    // Stats
    const stats = `${String(player.score).padStart(6)}${String(player.kills).padStart(6)}${String(player.deaths).padStart(7)}${String(player.bestStreak).padStart(7)}`;
    putText(screen, ARENA_X_OFFSET + 15, rowY, stats, {
      color: 'white',
      bgColor: 'black',
    });
  }

  // ── Instructions ──────────────────────────────────────────────────
  const instrY = boxBottom - 1;
  const instrStr = 'R: rematch | Q: quit';
  const iX = ARENA_X_OFFSET + Math.floor((width - instrStr.length) / 2);
  putText(screen, iX, instrY, instrStr, ATTR_HUD_DIM);
};
