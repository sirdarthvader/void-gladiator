import type { GameState } from '@void-gladiator/game-core';

// ANSI color helpers
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const WHITE_BRIGHT = '\x1b[97m';
const DIM = '\x1b[2m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';

const PROJECTILE_GLYPHS: Record<string, string> = {
  up: '|',
  down: '|',
  left: '-',
  right: '-',
};

const buildBorder = (width: number): string => {
  return `+${'-'.repeat(width)}+`;
};

const buildHealthBar = (health: number, maxHealth: number): string => {
  const filled = '♥'.repeat(health);
  const empty = '♡'.repeat(maxHealth - health);
  const color = health > 2 ? GREEN : health > 1 ? YELLOW : RED;
  return `${color}${filled}${DIM}${empty}${RESET}`;
};

export const renderArenaFrame = (state: GameState): string => {
  const rows: string[] = [];
  const border = buildBorder(state.arenaWidth);

  // HUD top line
  const hud = `${CYAN}${state.title}${RESET}  HP: ${buildHealthBar(state.player.health, state.player.maxHealth)}  ${DIM}Enemies: ${state.enemies.length}${RESET}`;
  rows.push(hud);
  rows.push(border);

  // Build a lookup map for entity positions
  const entityMap = new Map<string, { char: string; color: string }>();

  for (const enemy of state.enemies) {
    entityMap.set(`${Math.round(enemy.x)},${Math.round(enemy.y)}`, {
      char: enemy.glyph,
      color: RED,
    });
  }

  for (const proj of state.projectiles) {
    const glyph = PROJECTILE_GLYPHS[proj.direction] ?? '*';
    const color = proj.owner === 'player' ? WHITE_BRIGHT : RED;
    entityMap.set(`${Math.round(proj.x)},${Math.round(proj.y)}`, {
      char: glyph,
      color,
    });
  }

  for (let y = 0; y < state.arenaHeight; y += 1) {
    let row = '|';

    for (let x = 0; x < state.arenaWidth; x += 1) {
      if (x === state.player.x && y === state.player.y) {
        const playerColor = state.player.invincibilityTicks > 0 && state.tick % 4 < 2
          ? DIM
          : CYAN;
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

    row += '|';
    rows.push(row);
  }

  rows.push(border);

  // Bottom status line
  if (state.gameOver) {
    rows.push(`${RED}DEFEATED${RESET} — Final tick: ${state.tick}`);
  } else {
    const cdStatus = state.player.fireCooldown > 0 ? `${DIM}reloading${RESET}` : `${GREEN}ready${RESET}`;
    rows.push(`${DIM}WASD:move Space:fire Q:quit${RESET}  Fire: ${cdStatus}`);
  }

  return rows.join('\n');
};
