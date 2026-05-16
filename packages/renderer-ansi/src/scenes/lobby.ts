import type { LobbyScene } from '@void-gladiator/game-core';
import { GAME_MODES, PLAYER_VISUALS } from '@void-gladiator/content';
import {
  bold,
  dim,
  cyan,
  green,
  yellow,
  whiteBright,
  colorize,
} from '../colors.js';
import { buildTopBorder, buildBottomBorder } from '../components/ui.js';
import { stringWidth, cursorToCol } from '../char-width.js';

/** Wrap content in a bordered row, correctly handling ANSI padding. */
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
 * Render the lobby screen — player slots, mode selection, ready status.
 */
export const renderLobby = (state: LobbyScene): string => {
  const { lobby } = state;
  const width = state.arenaWidth;
  const rows: string[] = [];
  const mode = GAME_MODES[lobby.selectedMode];

  rows.push('');
  rows.push(buildTopBorder(width));

  // Header
  const header = cyan(bold('V O I D   G L A D I A T O R'));
  rows.push(borderedRow(centerInWidth(header, width), width));
  rows.push(emptyRow(width));

  // Player slots
  for (let i = 0; i < 4; i++) {
    const player = lobby.players[i];
    const visual = PLAYER_VISUALS[i];

    let line: string;
    if (player) {
      const readyStr = player.ready ? green(bold('READY')) : dim('waiting');
      const glyph = colorize(visual.color, visual.glyph);
      const dots = '.'.repeat(Math.max(0, 28 - player.name.length));
      line = `   ${glyph} ${player.name} ${dim(dots)} ${readyStr}`;
    } else {
      line = `   ${dim(`${visual.glyph} (empty)`)}`;
    }
    rows.push(borderedRow(line, width));
  }

  rows.push(emptyRow(width));

  // Mode selection
  const modeLine = `   Mode: ${yellow(bold(`[${mode.name.toUpperCase()}]`))}  ${dim('<< >> to change')}`;
  rows.push(borderedRow(modeLine, width));

  // Mode description
  const descLine = `   ${dim(mode.description)}`;
  rows.push(borderedRow(descLine, width));

  // Player range
  const rangeLine = `   ${dim(`Players: ${mode.minPlayers}-${mode.maxPlayers}`)}`;
  rows.push(borderedRow(rangeLine, width));

  rows.push(emptyRow(width));

  // Countdown, insufficient players warning, or instructions
  const allReady = lobby.players.every((p) => p.ready);
  const hasEnoughPlayers = lobby.players.length >= mode.minPlayers;

  if (lobby.countdown !== null) {
    const seconds = Math.ceil(lobby.countdown / 30);
    const countdownLine = whiteBright(bold(`Starting in ${seconds}...`));
    rows.push(borderedRow(centerInWidth(countdownLine, width), width));
  } else if (allReady && !hasEnoughPlayers) {
    const warnLine = yellow(
      bold(`Need ${mode.minPlayers}+ players for ${mode.name}`)
    );
    rows.push(borderedRow(centerInWidth(warnLine, width), width));
  } else {
    const instrLine = dim('SPACE: toggle ready │ A/D: mode │ Q: quit');
    rows.push(borderedRow(centerInWidth(instrLine, width), width));
  }

  rows.push(emptyRow(width));
  rows.push(buildBottomBorder(width));
  rows.push('');

  return rows.join('\n');
};
