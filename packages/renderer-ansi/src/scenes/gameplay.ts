import type { GameplayScene } from '@void-gladiator/game-core';
import { PLAYER_VISUALS } from '@void-gladiator/content';
import {
  bold,
  dim,
  cyan,
  red,
  green,
  yellow,
  colorize,
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
import { charWidth, cursorToCol } from '../char-width.js';

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
  const rightCol = cursorToCol(gs.arenaWidth + 2); // force right border column

  // HUD top line — player stats
  const hudParts: string[] = [];
  for (const player of gs.players) {
    const visual = PLAYER_VISUALS[player.id % PLAYER_VISUALS.length];
    const hp = buildHealthBar(player.health, player.maxHealth);
    const glyph = colorize(visual.color, visual.glyph);
    const statusWrap = player.status !== 'alive' ? dim : (s: string) => s;
    hudParts.push(`${statusWrap(glyph)} ${hp} ${dim(String(player.score))}`);
  }

  const waveInfo =
    gs.mode === 'void_storm'
      ? dim(`Wave ${gs.wave}`)
      : dim(`Round ${gs.round}`);

  const hudLine = `${cyan(bold('VOID GLADIATOR'))}  ${hudParts.join('  ')}  ${waveInfo}`;
  rows.push(padRight(hudLine, totalWidth));

  // Arena border (top)
  rows.push(buildTopBorder(gs.arenaWidth));

  // Build entity lookup map
  const entityMap = new Map<
    string,
    { char: string; style: (s: string) => string }
  >();

  for (const enemy of gs.enemies) {
    entityMap.set(`${Math.round(enemy.x)},${Math.round(enemy.y)}`, {
      char: enemy.glyph,
      style: red,
    });
  }

  for (const proj of gs.projectiles) {
    const glyph = PROJECTILE_GLYPHS[proj.direction] ?? '•';
    const visual = PLAYER_VISUALS[proj.ownerId % PLAYER_VISUALS.length];
    const styleFn =
      proj.ownerId >= 0
        ? (s: string) => bold(colorize(visual.color, s))
        : (s: string) => bold(red(s));
    entityMap.set(`${Math.round(proj.x)},${Math.round(proj.y)}`, {
      char: glyph,
      style: styleFn,
    });
  }

  // Render arena rows
  for (let y = 0; y < gs.arenaHeight; y += 1) {
    let row = LEFT_BORDER;
    let skipNext = false;

    for (let x = 0; x < gs.arenaWidth; x += 1) {
      // A previous wide character already covers this cell visually.
      if (skipNext) {
        skipNext = false;
        continue;
      }

      let rawChar = ' ';
      let cell = ' ';

      // Check if any player is here
      const playerHere = gs.players.find(
        (p) => p.x === x && p.y === y && p.status === 'alive'
      );

      if (playerHere) {
        const visual = PLAYER_VISUALS[playerHere.id % PLAYER_VISUALS.length];
        const isFlashing = playerHere.invincibilityTicks > 0 && gs.tick % 4 < 2;
        rawChar = playerHere.glyph;
        cell = isFlashing
          ? dim(rawChar)
          : bold(colorize(visual.color, rawChar));
      } else {
        // Check for dead players (show ghost)
        const deadHere = gs.players.find(
          (p) => p.x === x && p.y === y && p.status === 'dead'
        );

        if (deadHere) {
          const visual = PLAYER_VISUALS[deadHere.id % PLAYER_VISUALS.length];
          rawChar = '✕';
          cell = dim(colorize(visual.color, rawChar));
        } else {
          const entity = entityMap.get(`${x},${y}`);
          if (entity) {
            rawChar = entity.char;
            cell = entity.style(rawChar);
          }
        }
      }

      row += cell;
      if (charWidth(rawChar) > 1) {
        skipNext = true;
      }
    }

    row += rightCol + RIGHT_BORDER;
    rows.push(row);
  }

  // Arena border (bottom)
  rows.push(buildBottomBorder(gs.arenaWidth));

  // Bottom status bar
  if (gs.matchOver) {
    const winnerText =
      gs.matchWinnerId !== null
        ? bold(
            colorize(
              PLAYER_VISUALS[gs.matchWinnerId % PLAYER_VISUALS.length].color,
              `Player ${gs.matchWinnerId + 1} WINS!`
            )
          )
        : bold(red('DEFEATED'));
    rows.push(
      padRight(`${winnerText}  ${dim(`Final tick: ${gs.tick}`)}`, totalWidth)
    );
  } else if (gs.roundOver) {
    const winnerText =
      gs.roundWinnerId !== null
        ? colorize(
            PLAYER_VISUALS[gs.roundWinnerId % PLAYER_VISUALS.length].color,
            `Round ${gs.round} — Player ${gs.roundWinnerId + 1} wins!`
          )
        : yellow('Round draw');
    rows.push(padRight(winnerText, totalWidth));
  } else {
    // Show local player status (player 0 for now)
    const p0 = gs.players[0];
    if (p0 && p0.status === 'alive') {
      const fireStatus =
        p0.fireCooldown > 0 ? dim('reloading') : green('ready');
      const streakStr =
        p0.streak > 1 ? `  ${yellow(bold(`×${p0.streak}`))}` : '';
      rows.push(
        padRight(
          `${dim('WASD:move Space:fire K:dash J:special Q:quit')}  Fire: ${fireStatus}${streakStr}`,
          totalWidth
        )
      );
    } else if (p0 && p0.status === 'dead') {
      const respawnSec = Math.ceil(p0.respawnTimer / 30);
      rows.push(
        padRight(
          `${red('DEFEATED')} ${dim(`— respawning in ${respawnSec}s`)}`,
          totalWidth
        )
      );
    }
  }

  return rows.join('\n');
};
