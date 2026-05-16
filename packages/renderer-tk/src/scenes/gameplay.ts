/**
 * Enhanced gameplay scene renderer — draws the arena, entities, and HUD
 * using terminal-kit ScreenBuffer with cell-level control.
 */

import type { GameplayScene } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';
import type { Screen } from '../screen.js';
import {
  ARENA_X_OFFSET,
  ARENA_Y_OFFSET,
  putCell,
  putText,
  drawSprite,
  clearScreen,
} from '../screen.js';
import {
  ATTR_BORDER,
  ATTR_FLOOR,
  ATTR_FLOOR_DOT,
  ATTR_HUD_TITLE,
  ATTR_HUD_DIM,
  playerAttr,
  healthColor,
} from '../colors.js';
import {
  getPlayerSprite,
  getEnemySprite,
  getProjectileGlyph,
  DEAD_MARKER,
} from '../sprites.js';

/**
 * Render the gameplay scene onto the screen buffer.
 */
export const renderGameplay = (state: GameplayScene, screen: Screen): void => {
  const { gameplay: gs } = state;
  clearScreen(screen);

  // ── HUD (row 0) ──────────────────────────────────────────────────
  putText(screen, 0, 0, 'VOID GLADIATOR', ATTR_HUD_TITLE);

  let hudX = 16;
  for (const player of gs.players) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];
    const pa = playerAttr(visual.color);

    // Player glyph
    putText(screen, hudX, 0, visual.glyph, pa);
    hudX += 2;

    // Health bar
    const hc = healthColor(player.health);
    for (let h = 0; h < player.maxHealth; h++) {
      const filled = h < player.health;
      putCell(screen, hudX + h, 0, filled ? '#' : '.', {
        color: filled ? hc : 'white',
        bgColor: 'black',
        dim: !filled,
        bold: filled,
      });
    }
    hudX += player.maxHealth + 1;

    // Score
    const scoreStr = String(player.score);
    putText(screen, hudX, 0, scoreStr, ATTR_HUD_DIM);
    hudX += scoreStr.length + 2;
  }

  // Wave/Round info
  const waveInfo =
    gs.mode === 'void_storm' ? `Wave ${gs.wave}` : `Round ${gs.round}`;
  putText(screen, screen.width - waveInfo.length - 1, 0, waveInfo, ATTR_HUD_DIM);

  // ── Arena borders ─────────────────────────────────────────────────
  const borderTop = ARENA_Y_OFFSET - 1; // row 1
  const borderBottom = ARENA_Y_OFFSET + gs.arenaHeight; // row after arena

  // Top border
  putCell(screen, 0, borderTop, '+', ATTR_BORDER);
  for (let x = 1; x <= gs.arenaWidth; x++) {
    putCell(screen, x, borderTop, '-', ATTR_BORDER);
  }
  putCell(screen, gs.arenaWidth + 1, borderTop, '+', ATTR_BORDER);

  // Bottom border
  putCell(screen, 0, borderBottom, '+', ATTR_BORDER);
  for (let x = 1; x <= gs.arenaWidth; x++) {
    putCell(screen, x, borderBottom, '-', ATTR_BORDER);
  }
  putCell(screen, gs.arenaWidth + 1, borderBottom, '+', ATTR_BORDER);

  // Side borders
  for (let y = ARENA_Y_OFFSET; y < ARENA_Y_OFFSET + gs.arenaHeight; y++) {
    putCell(screen, 0, y, '|', ATTR_BORDER);
    putCell(screen, gs.arenaWidth + 1, y, '|', ATTR_BORDER);
  }

  // ── Arena floor ───────────────────────────────────────────────────
  for (let y = 0; y < gs.arenaHeight; y++) {
    for (let x = 0; x < gs.arenaWidth; x++) {
      // Subtle grid dots every 4 cells for depth
      const isDot = x % 4 === 0 && y % 4 === 0;
      putCell(
        screen,
        x + ARENA_X_OFFSET,
        y + ARENA_Y_OFFSET,
        isDot ? '.' : ' ',
        isDot ? ATTR_FLOOR_DOT : ATTR_FLOOR
      );
    }
  }

  // ── Enemies ───────────────────────────────────────────────────────
  for (const enemy of gs.enemies) {
    const sprite = getEnemySprite(enemy.kind);
    drawSprite(screen, sprite, Math.round(enemy.x), Math.round(enemy.y));
  }

  // ── Projectiles ───────────────────────────────────────────────────
  for (const proj of gs.projectiles) {
    const glyph = getProjectileGlyph(proj.direction);
    const visual = PLAYER_VISUALS[proj.ownerId % PLAYER_VISUALS.length];
    const color = proj.ownerId >= 0 ? visual?.color ?? 'white' : 'red';

    putCell(
      screen,
      Math.round(proj.x) + ARENA_X_OFFSET,
      Math.round(proj.y) + ARENA_Y_OFFSET,
      glyph,
      { color, bgColor: 232, bold: true }
    );
  }

  // ── Players ───────────────────────────────────────────────────────
  for (const player of gs.players) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];

    if (player.status === 'alive') {
      const isFlashing =
        player.invincibilityTicks > 0 && gs.tick % 4 < 2;

      if (isFlashing) {
        // Dim single-cell during invincibility flash
        putCell(
          screen,
          player.x + ARENA_X_OFFSET,
          player.y + ARENA_Y_OFFSET,
          '@',
          { color: visual.color, bgColor: 232, dim: true }
        );
      } else {
        const sprite = getPlayerSprite(player.id);
        drawSprite(screen, sprite, player.x, player.y, visual.color);
      }
    } else if (player.status === 'dead') {
      drawSprite(
        screen,
        DEAD_MARKER,
        player.x,
        player.y,
        visual.color
      );
    }
  }

  // ── Status bar (bottom) ───────────────────────────────────────────
  const statusY = screen.height - 1;

  if (gs.matchOver) {
    const winText =
      gs.matchWinnerId !== null
        ? `Player ${gs.matchWinnerId + 1} WINS!`
        : 'DEFEATED';
    const winColor =
      gs.matchWinnerId !== null
        ? PLAYER_VISUALS[gs.matchWinnerId % PLAYER_VISUALS.length].color
        : 'red';
    putText(screen, 0, statusY, winText, {
      color: winColor,
      bgColor: 'black',
      bold: true,
    });
    const tickInfo = `  Final tick: ${gs.tick}`;
    putText(screen, winText.length, statusY, tickInfo, ATTR_HUD_DIM);
  } else if (gs.roundOver) {
    const roundText =
      gs.roundWinnerId !== null
        ? `Round ${gs.round} - Player ${gs.roundWinnerId + 1} wins!`
        : 'Round draw';
    const roundColor =
      gs.roundWinnerId !== null
        ? PLAYER_VISUALS[gs.roundWinnerId % PLAYER_VISUALS.length].color
        : 'yellow';
    putText(screen, 0, statusY, roundText, {
      color: roundColor,
      bgColor: 'black',
    });
  } else {
    const p0 = gs.players[0];
    if (p0 && p0.status === 'alive') {
      const controls = 'WASD:move Space:fire K:dash J:special Q:quit';
      putText(screen, 0, statusY, controls, ATTR_HUD_DIM);

      const fireStatus =
        p0.fireCooldown > 0 ? 'reloading' : 'ready';
      const fireColor = p0.fireCooldown > 0 ? 'white' : 'green';
      const fireX = controls.length + 2;
      putText(screen, fireX, statusY, `Fire: ${fireStatus}`, {
        color: fireColor,
        bgColor: 'black',
        dim: p0.fireCooldown > 0,
      });

      if (p0.streak > 1) {
        const streakStr = `x${p0.streak}`;
        putText(screen, fireX + 15, statusY, streakStr, {
          color: 'yellow',
          bgColor: 'black',
          bold: true,
        });
      }
    } else if (p0 && p0.status === 'dead') {
      const respawnSec = Math.ceil(p0.respawnTimer / 30);
      putText(screen, 0, statusY, 'DEFEATED', {
        color: 'red',
        bgColor: 'black',
      });
      putText(screen, 10, statusY, `- respawning in ${respawnSec}s`, ATTR_HUD_DIM);
    }
  }
};
