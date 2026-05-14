import type { AppState, GameState } from '@void-gladiator/game-core';
import { renderTitle } from './scenes/title.js';
import { renderLobby } from './scenes/lobby.js';
import { renderGameplay } from './scenes/gameplay.js';
import { renderResults } from './scenes/results.js';

// Re-export scene renderers for direct use
export { renderTitle } from './scenes/title.js';
export { renderLobby } from './scenes/lobby.js';
export { renderGameplay } from './scenes/gameplay.js';
export { renderResults } from './scenes/results.js';

/**
 * Render any scene — the top-level render dispatcher.
 * Switches on the scene type and delegates to the appropriate renderer.
 */
export const renderFrame = (state: AppState): string => {
  switch (state.scene) {
    case 'title':
      return renderTitle(state);
    case 'lobby':
      return renderLobby(state);
    case 'gameplay':
      return renderGameplay(state);
    case 'results':
      return renderResults(state);
  }
};

// ============================================================
// Legacy API — backward compatibility for existing app shell.
// ============================================================

import {
  RESET,
  DIM,
  CYAN,
  RED,
  GREEN,
  YELLOW,
  BOLD,
  PROJ_HORIZONTAL,
  PROJ_VERTICAL,
  BOX_TOP_LEFT,
  BOX_TOP_RIGHT,
  BOX_BOTTOM_LEFT,
  BOX_BOTTOM_RIGHT,
  BOX_HORIZONTAL,
  BOX_VERTICAL,
} from './colors.js';

const PROJECTILE_GLYPHS: Record<string, string> = {
  up: PROJ_VERTICAL,
  down: PROJ_VERTICAL,
  left: PROJ_HORIZONTAL,
  right: PROJ_HORIZONTAL,
};

const buildBorder = (width: number): string => {
  return `${DIM}${BOX_TOP_LEFT}${BOX_HORIZONTAL.repeat(width)}${BOX_TOP_RIGHT}${RESET}`;
};

const buildBottomBorderLegacy = (width: number): string => {
  return `${DIM}${BOX_BOTTOM_LEFT}${BOX_HORIZONTAL.repeat(width)}${BOX_BOTTOM_RIGHT}${RESET}`;
};

const buildHealthBar = (health: number, maxHealth: number): string => {
  const filled = '♥'.repeat(health);
  const empty = '♡'.repeat(maxHealth - health);
  const color = health > 2 ? GREEN : health > 1 ? YELLOW : RED;
  return `${color}${filled}${DIM}${empty}${RESET}`;
};

/**
 * @deprecated Use renderFrame(appState) instead.
 * Legacy single-player arena renderer — kept for backward compat.
 */
export const renderArenaFrame = (state: GameState): string => {
  const rows: string[] = [];

  // HUD top line
  const hud = `${CYAN}${BOLD}${state.title}${RESET}  HP: ${buildHealthBar(state.player.health, state.player.maxHealth)}  ${DIM}Enemies: ${state.enemies.length}${RESET}`;
  rows.push(hud);
  rows.push(buildBorder(state.arenaWidth));

  // Build entity map
  const entityMap = new Map<string, { char: string; color: string }>();

  for (const enemy of state.enemies) {
    entityMap.set(`${Math.round(enemy.x)},${Math.round(enemy.y)}`, {
      char: enemy.glyph,
      color: RED,
    });
  }

  for (const proj of state.projectiles) {
    const glyph = PROJECTILE_GLYPHS[proj.direction] ?? '•';
    const color = proj.owner === 'player' ? `${BOLD}${CYAN}` : RED;
    entityMap.set(`${Math.round(proj.x)},${Math.round(proj.y)}`, {
      char: glyph,
      color,
    });
  }

  for (let y = 0; y < state.arenaHeight; y += 1) {
    let row = `${DIM}${BOX_VERTICAL}${RESET}`;

    for (let x = 0; x < state.arenaWidth; x += 1) {
      if (x === state.player.x && y === state.player.y) {
        const playerColor = state.player.invincibilityTicks > 0 && state.tick % 4 < 2
          ? DIM
          : `${BOLD}${CYAN}`;
        row += `${playerColor}${state.player.glyph}${RESET}`;
      } else {
        const entity = entityMap.get(`${x},${y}`);
        if (entity) {
          row += `${entity.color}${entity.char}${RESET}`;
        } else {
          row += ' ';
        }
      }
    }

    row += `${DIM}${BOX_VERTICAL}${RESET}`;
    rows.push(row);
  }

  rows.push(buildBottomBorderLegacy(state.arenaWidth));

  // Bottom status line
  if (state.gameOver) {
    rows.push(`${RED}${BOLD}DEFEATED${RESET} — Final tick: ${state.tick}`);
  } else {
    const cdStatus = state.player.fireCooldown > 0 ? `${DIM}reloading${RESET}` : `${GREEN}ready${RESET}`;
    rows.push(`${DIM}WASD:move Space:fire K:dash J:special Q:quit${RESET}  Fire: ${cdStatus}`);
  }

  return rows.join('\n');
};
