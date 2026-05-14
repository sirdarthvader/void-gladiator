import type { GameplayScene } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';
import {
  RESET,
  BOLD,
  DIM,
  CYAN,
  RED,
  GREEN,
  YELLOW,
  PROJ_HORIZONTAL,
  PROJ_VERTICAL,
} from '../colors.js';
import {
  buildTopBorder,
  buildBottomBorder,
  LEFT_BORDER,
  RIGHT_BORDER,
  buildHealthBar,
  padRight,
} from '../components/ui.js';

const PROJECTILE_GLYPHS: Record<string, string> = {
  up: PROJ_VERTICAL,
  down: PROJ_VERTICAL,
  left: PROJ_HORIZONTAL,
  right: PROJ_HORIZONTAL,
};

/**
 * Render the gameplay arena with all entities.
 */
export const renderGameplay = (state: GameplayScene): string => {
  const { gameplay: gs } = state;
  const rows: string[] = [];
  const totalWidth = gs.arenaWidth + 2; // arena + 2 border chars

  // HUD top line — player stats
  const hudParts: string[] = [];
  for (const player of gs.players) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];
    const hp = buildHealthBar(player.health, player.maxHealth);
    const statusDim = player.status !== 'alive' ? DIM : '';
    hudParts.push(
      `${statusDim}${visual.colorCode}${visual.glyph}${RESET}${statusDim} ${hp} ${DIM}${player.score}${RESET}`
    );
  }

  const waveInfo = gs.mode === 'void_storm'
    ? `${DIM}Wave ${gs.wave}${RESET}`
    : `${DIM}Round ${gs.round}${RESET}`;

  const hudLine = `${CYAN}${BOLD}VOID GLADIATOR${RESET}  ${hudParts.join('  ')}  ${waveInfo}`;
  rows.push(padRight(hudLine, totalWidth));

  // Arena border (top)
  rows.push(buildTopBorder(gs.arenaWidth));

  // Build entity lookup map
  const entityMap = new Map<string, { char: string; color: string }>();

  for (const enemy of gs.enemies) {
    entityMap.set(`${Math.round(enemy.x)},${Math.round(enemy.y)}`, {
      char: enemy.glyph,
      color: RED,
    });
  }

  for (const proj of gs.projectiles) {
    const glyph = PROJECTILE_GLYPHS[proj.direction] ?? '•';
    const visual = PLAYER_VISUALS[proj.ownerId % PLAYER_VISUALS.length];
    const color = proj.ownerId >= 0 ? visual.colorCode : RED;
    entityMap.set(`${Math.round(proj.x)},${Math.round(proj.y)}`, {
      char: glyph,
      color: `${BOLD}${color}`,
    });
  }

  // Render arena rows
  for (let y = 0; y < gs.arenaHeight; y += 1) {
    let row = LEFT_BORDER;

    for (let x = 0; x < gs.arenaWidth; x += 1) {
      // Check if any player is here
      const playerHere = gs.players.find(
        (p) => p.x === x && p.y === y && p.status === 'alive'
      );

      if (playerHere) {
        const visual = PLAYER_VISUALS[playerHere.id % PLAYER_VISUALS.length];
        const isFlashing =
          playerHere.invincibilityTicks > 0 && gs.tick % 4 < 2;
        const color = isFlashing ? DIM : `${BOLD}${visual.colorCode}`;
        row += `${color}${playerHere.glyph}${RESET}`;
      } else {
        // Check for dead players (show ghost)
        const deadHere = gs.players.find(
          (p) => p.x === x && p.y === y && p.status === 'dead'
        );

        if (deadHere) {
          const visual = PLAYER_VISUALS[deadHere.id % PLAYER_VISUALS.length];
          row += `${DIM}${visual.colorCode}✕${RESET}`;
        } else {
          const entity = entityMap.get(`${x},${y}`);
          if (entity) {
            row += `${entity.color}${entity.char}${RESET}`;
          } else {
            row += ' ';
          }
        }
      }
    }

    row += RIGHT_BORDER;
    rows.push(row);
  }

  // Arena border (bottom)
  rows.push(buildBottomBorder(gs.arenaWidth));

  // Bottom status bar
  if (gs.matchOver) {
    const winnerText = gs.matchWinnerId !== null
      ? `${PLAYER_VISUALS[gs.matchWinnerId % PLAYER_VISUALS.length].colorCode}${BOLD}Player ${gs.matchWinnerId + 1} WINS!${RESET}`
      : `${RED}${BOLD}DEFEATED${RESET}`;
    rows.push(padRight(`${winnerText}  ${DIM}Final tick: ${gs.tick}${RESET}`, totalWidth));
  } else if (gs.roundOver) {
    const winnerText = gs.roundWinnerId !== null
      ? `${PLAYER_VISUALS[gs.roundWinnerId % PLAYER_VISUALS.length].colorCode}Round ${gs.round} — Player ${gs.roundWinnerId + 1} wins!${RESET}`
      : `${YELLOW}Round draw${RESET}`;
    rows.push(padRight(winnerText, totalWidth));
  } else {
    // Show local player status (player 0 for now)
    const p0 = gs.players[0];
    if (p0 && p0.status === 'alive') {
      const fireStatus = p0.fireCooldown > 0
        ? `${DIM}reloading${RESET}`
        : `${GREEN}ready${RESET}`;
      const streakStr = p0.streak > 1
        ? `  ${YELLOW}${BOLD}×${p0.streak}${RESET}`
        : '';
      rows.push(
        padRight(`${DIM}WASD:move Space:fire K:dash J:special Q:quit${RESET}  Fire: ${fireStatus}${streakStr}`, totalWidth)
      );
    } else if (p0 && p0.status === 'dead') {
      const respawnSec = Math.ceil(p0.respawnTimer / 30);
      rows.push(padRight(`${RED}DEFEATED${RESET} ${DIM}— respawning in ${respawnSec}s${RESET}`, totalWidth));
    }
  }

  return rows.join('\n');
};
