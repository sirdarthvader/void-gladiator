/**
 * Enhanced gameplay scene renderer — draws the arena, entities, and HUD
 * using terminal-kit ScreenBuffer with cell-level control.
 *
 * Renders particles, hit markers, screen shake, flash, and ambient drift.
 */

import type { GameplayScene } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';
import type { Screen } from '../screen.js';
import type { RenderState } from '../render-state.js';
import type { AmbienceState } from '../ambience.js';
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
export const renderGameplay = (
  state: GameplayScene,
  screen: Screen,
  renderState: RenderState,
  ambience: AmbienceState
): void => {
  const { gameplay: gs } = state;

  // Screen shake offset (applied to arena content drawing)
  const shakeX = renderState.shake?.offsetX ?? 0;
  const shakeY = renderState.shake?.offsetY ?? 0;

  clearScreen(screen);

  // ── Flash overlay (drawn as tinted background before content) ─────
  const flashAttr = renderState.flash
    ? { color: renderState.flash.color, bgColor: renderState.flash.color, dim: true }
    : null;

  // Arena bounds for clipping particles / hit markers
  const arenaXMin = ARENA_X_OFFSET;
  const arenaXMax = ARENA_X_OFFSET + gs.arenaWidth - 1;
  const arenaYMin = ARENA_Y_OFFSET;
  const arenaYMax = ARENA_Y_OFFSET + gs.arenaHeight - 1;

  // ── Arena borders ─────────────────────────────────────────────────
  const borderTop = ARENA_Y_OFFSET - 1;
  const borderBottom = ARENA_Y_OFFSET + gs.arenaHeight;

  putCell(screen, 0 + shakeX, borderTop + shakeY, '+', ATTR_BORDER);
  for (let x = 1; x <= gs.arenaWidth; x++) {
    putCell(screen, x + shakeX, borderTop + shakeY, '-', ATTR_BORDER);
  }
  putCell(screen, gs.arenaWidth + 1 + shakeX, borderTop + shakeY, '+', ATTR_BORDER);

  putCell(screen, 0 + shakeX, borderBottom + shakeY, '+', ATTR_BORDER);
  for (let x = 1; x <= gs.arenaWidth; x++) {
    putCell(screen, x + shakeX, borderBottom + shakeY, '-', ATTR_BORDER);
  }
  putCell(screen, gs.arenaWidth + 1 + shakeX, borderBottom + shakeY, '+', ATTR_BORDER);

  for (let y = ARENA_Y_OFFSET; y < ARENA_Y_OFFSET + gs.arenaHeight; y++) {
    putCell(screen, 0 + shakeX, y + shakeY, '|', ATTR_BORDER);
    putCell(screen, gs.arenaWidth + 1 + shakeX, y + shakeY, '|', ATTR_BORDER);
  }

  // ── Arena floor ───────────────────────────────────────────────────
  const aox = ARENA_X_OFFSET + shakeX;
  const aoy = ARENA_Y_OFFSET + shakeY;

  for (let y = 0; y < gs.arenaHeight; y++) {
    for (let x = 0; x < gs.arenaWidth; x++) {
      const isDot = x % 4 === 0 && y % 4 === 0;
      const floorAttr = flashAttr
        ? { ...ATTR_FLOOR, bgColor: flashAttr.bgColor }
        : isDot
          ? ATTR_FLOOR_DOT
          : ATTR_FLOOR;
      putCell(screen, x + aox, y + aoy, isDot ? '.' : ' ', floorAttr);
    }
  }

  // ── Ambient drift particles (below entities) ──────────────────────
  for (const ap of ambience.particles) {
    const ax = Math.round(ap.x) + aox;
    const ay = Math.round(ap.y) + aoy;
    const fade = ap.life / ap.maxLife;
    if (fade > 0) {
      putCell(screen, ax, ay, ap.char, {
        color: ap.color,
        bgColor: 232,
        dim: fade < 0.5,
      });
    }
  }

  // ── Enemies ───────────────────────────────────────────────────────
  for (const enemy of gs.enemies) {
    const sprite = getEnemySprite(enemy.kind);
    drawSprite(screen, sprite, Math.round(enemy.x) + shakeX, Math.round(enemy.y) + shakeY);
  }

  // ── Projectiles ───────────────────────────────────────────────────
  for (const proj of gs.projectiles) {
    const glyph = getProjectileGlyph(proj.direction);
    const visual = PLAYER_VISUALS[proj.ownerId % PLAYER_VISUALS.length];
    const color = proj.ownerId >= 0 ? visual?.color ?? 'white' : 'red';

    putCell(
      screen,
      Math.round(proj.x) + aox,
      Math.round(proj.y) + aoy,
      glyph,
      { color, bgColor: 232, bold: true }
    );
  }

  // ── Particles (clipped to arena bounds) ─────────────────────────
  for (const p of renderState.particles) {
    const px = Math.round(p.x) + aox;
    const py = Math.round(p.y) + aoy;
    if (px < arenaXMin || px > arenaXMax || py < arenaYMin || py > arenaYMax) continue;
    const fade = p.life / p.maxLife; // 1→0
    putCell(screen, px, py, p.char, {
      color: p.color,
      bgColor: 232,
      bold: p.bold && fade > 0.5,
      dim: fade < 0.4,
    });
  }

  // ── Hit markers (clipped to arena bounds) ──────────────────────
  for (const hm of renderState.hitMarkers) {
    const hx = Math.round(hm.x) + aox;
    const hy = Math.round(hm.y) + aoy;
    if (hx < arenaXMin || hx > arenaXMax || hy < arenaYMin || hy > arenaYMax) continue;
    putCell(screen, hx, hy, hm.char, {
      color: hm.color,
      bgColor: 232,
      bold: true,
    });
  }

  // ── Players (drawn last so they're always on top) ─────────────────
  for (const player of gs.players) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];

    if (player.status === 'alive') {
      const isFlashing =
        player.invincibilityTicks > 0 && gs.tick % 4 < 2;

      if (isFlashing) {
        putCell(
          screen,
          player.x + aox,
          player.y + aoy,
          '@',
          { color: visual.color, bgColor: 232, dim: true }
        );
      } else {
        const sprite = getPlayerSprite(player.id);
        drawSprite(screen, sprite, player.x + shakeX, player.y + shakeY, visual.color);
      }
    } else if (player.status === 'dead') {
      drawSprite(
        screen,
        DEAD_MARKER,
        player.x + shakeX,
        player.y + shakeY,
        visual.color
      );
    }
  }

  // ── HUD (row 0, drawn after arena content so shake can't overwrite) ──
  putText(screen, 0, 0, 'VOID GLADIATOR', ATTR_HUD_TITLE);

  let hudX = 16;
  for (const player of gs.players) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];
    const pa = playerAttr(visual.color);

    putText(screen, hudX, 0, visual.glyph, pa);
    hudX += 2;

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

    const scoreStr = String(player.score);
    putText(screen, hudX, 0, scoreStr, ATTR_HUD_DIM);
    hudX += scoreStr.length + 2;
  }

  const waveInfo =
    gs.mode === 'void_storm' ? `Wave ${gs.wave}` : `Round ${gs.round}`;
  putText(screen, screen.width - waveInfo.length - 1, 0, waveInfo, ATTR_HUD_DIM);

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
