import type { LobbyScene } from '@void-gladiator/game-core';
import { GAME_MODES, PLAYER_VISUALS } from '@void-gladiator/content';
import {
  RESET,
  BOLD,
  DIM,
  CYAN,
  GREEN,
  YELLOW,
  WHITE_BRIGHT,
} from '../colors.js';
import { buildTopBorder, buildBottomBorder } from '../components/ui.js';
import { ARENA_WIDTH } from '@void-gladiator/content';
import { stringWidth, cursorToCol } from '../char-width.js';

/** Wrap content in a bordered row, correctly handling ANSI padding. */
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
 * Render the lobby screen — player slots, mode selection, ready status.
 */
export const renderLobby = (state: LobbyScene): string => {
  const { lobby } = state;
  const width = ARENA_WIDTH;
  const rows: string[] = [];
  const mode = GAME_MODES[lobby.selectedMode];

  rows.push('');
  rows.push(buildTopBorder(width));

  // Header
  const header = `${CYAN}${BOLD}V O I D   G L A D I A T O R${RESET}`;
  rows.push(borderedRow(centerInWidth(header, width), width));
  rows.push(emptyRow(width));

  // Player slots
  for (let i = 0; i < 4; i++) {
    const player = lobby.players[i];
    const visual = PLAYER_VISUALS[i];

    let line: string;
    if (player) {
      const readyStr = player.ready
        ? `${GREEN}${BOLD}READY${RESET}`
        : `${DIM}waiting${RESET}`;
      const glyph = `${visual.colorCode}${visual.glyph}${RESET}`;
      const dots = '.'.repeat(Math.max(0, 28 - player.name.length));
      line = `   ${glyph} ${player.name} ${DIM}${dots}${RESET} ${readyStr}`;
    } else {
      line = `   ${DIM}${visual.glyph} (empty)${RESET}`;
    }
    rows.push(borderedRow(line, width));
  }

  rows.push(emptyRow(width));

  // Mode selection
  const modeLine = `   Mode: ${YELLOW}${BOLD}[${mode.name.toUpperCase()}]${RESET}  ${DIM}<< >> to change${RESET}`;
  rows.push(borderedRow(modeLine, width));

  // Mode description
  const descLine = `   ${DIM}${mode.description}${RESET}`;
  rows.push(borderedRow(descLine, width));

  // Player range
  const rangeLine = `   ${DIM}Players: ${mode.minPlayers}-${mode.maxPlayers}${RESET}`;
  rows.push(borderedRow(rangeLine, width));

  rows.push(emptyRow(width));

  // Countdown, insufficient players warning, or instructions
  const allReady = lobby.players.every((p) => p.ready);
  const hasEnoughPlayers = lobby.players.length >= mode.minPlayers;

  if (lobby.countdown !== null) {
    const seconds = Math.ceil(lobby.countdown / 30);
    const countdownLine = `${WHITE_BRIGHT}${BOLD}Starting in ${seconds}...${RESET}`;
    rows.push(borderedRow(centerInWidth(countdownLine, width), width));
  } else if (allReady && !hasEnoughPlayers) {
    const warnLine = `${YELLOW}${BOLD}Need ${mode.minPlayers}+ players for ${mode.name}${RESET}`;
    rows.push(borderedRow(centerInWidth(warnLine, width), width));
  } else {
    const instrLine = `${DIM}SPACE: toggle ready │ A/D: mode │ Q: quit${RESET}`;
    rows.push(borderedRow(centerInWidth(instrLine, width), width));
  }

  rows.push(emptyRow(width));
  rows.push(buildBottomBorder(width));
  rows.push('');

  return rows.join('\n');
};
