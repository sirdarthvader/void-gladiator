/**
 * Enhanced lobby scene renderer.
 */

import type { LobbyScene } from '@void-gladiator/game-core';
import { GAME_MODES, PLAYER_VISUALS } from '@void-gladiator/content';
import type { Screen } from '../screen.js';
import {
  ARENA_X_OFFSET,
  putCell,
  putText,
  clearScreen,
} from '../screen.js';
import { ATTR_BORDER, ATTR_HUD_DIM, playerAttr } from '../colors.js';

/**
 * Render the lobby scene onto the screen buffer.
 */
export const renderLobby = (state: LobbyScene, screen: Screen): void => {
  const { lobby } = state;
  clearScreen(screen);

  const width = state.arenaWidth;
  const boxTop = 1;
  const boxBottom = screen.height - 2;
  const boxLeft = 0;
  const boxRight = width + 1;
  const mode = GAME_MODES[lobby.selectedMode];

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
  const header = 'V O I D   G L A D I A T O R';
  const headerX = ARENA_X_OFFSET + Math.floor((width - header.length) / 2);
  putText(screen, headerX, boxTop + 1, header, {
    color: 'cyan',
    bgColor: 'black',
    bold: true,
  });

  // ── Player slots ──────────────────────────────────────────────────
  const slotsStartY = boxTop + 3;

  for (let i = 0; i < 4; i++) {
    const player = lobby.players[i];
    const visual = PLAYER_VISUALS[i];
    const y = slotsStartY + i;
    const slotX = ARENA_X_OFFSET + 3;

    if (player) {
      // Player glyph
      putText(screen, slotX, y, visual.glyph, playerAttr(visual.color));

      // Player name
      putText(screen, slotX + 2, y, player.name, {
        color: 'white',
        bgColor: 'black',
      });

      // Ready status
      const readyStr = player.ready ? 'READY' : 'waiting';
      const readyX = ARENA_X_OFFSET + 38;
      putText(screen, readyX, y, readyStr, {
        color: player.ready ? 'green' : 'white',
        bgColor: 'black',
        bold: player.ready,
        dim: !player.ready,
      });
    } else {
      putText(screen, slotX, y, `${visual.glyph} (empty)`, ATTR_HUD_DIM);
    }
  }

  // ── Mode selection ────────────────────────────────────────────────
  const modeY = slotsStartY + 5;
  putText(screen, ARENA_X_OFFSET + 3, modeY, 'Mode: ', ATTR_HUD_DIM);
  putText(screen, ARENA_X_OFFSET + 9, modeY, `[${mode.name.toUpperCase()}]`, {
    color: 'yellow',
    bgColor: 'black',
    bold: true,
  });
  putText(
    screen,
    ARENA_X_OFFSET + 9 + mode.name.length + 4,
    modeY,
    '<< >> to change',
    ATTR_HUD_DIM
  );

  // Mode description
  putText(screen, ARENA_X_OFFSET + 3, modeY + 1, mode.description, ATTR_HUD_DIM);

  // Player range
  putText(
    screen,
    ARENA_X_OFFSET + 3,
    modeY + 2,
    `Players: ${mode.minPlayers}-${mode.maxPlayers}`,
    ATTR_HUD_DIM
  );

  // ── Bottom instructions ───────────────────────────────────────────
  const instrY = boxBottom - 1;
  const allReady = lobby.players.every((p) => p.ready);
  const hasEnoughPlayers = lobby.players.length >= mode.minPlayers;

  if (lobby.countdown !== null) {
    const seconds = Math.ceil(lobby.countdown / 30);
    const countdownStr = `Starting in ${seconds}...`;
    const cdX = ARENA_X_OFFSET + Math.floor((width - countdownStr.length) / 2);
    putText(screen, cdX, instrY, countdownStr, {
      color: 'white',
      bgColor: 'black',
      bold: true,
    });
  } else if (allReady && !hasEnoughPlayers) {
    const warnStr = `Need ${mode.minPlayers}+ players for ${mode.name}`;
    const wX = ARENA_X_OFFSET + Math.floor((width - warnStr.length) / 2);
    putText(screen, wX, instrY, warnStr, {
      color: 'yellow',
      bgColor: 'black',
      bold: true,
    });
  } else {
    const instrStr = 'SPACE: toggle ready | A/D: mode | Q: quit';
    const iX = ARENA_X_OFFSET + Math.floor((width - instrStr.length) / 2);
    putText(screen, iX, instrY, instrStr, ATTR_HUD_DIM);
  }
};
