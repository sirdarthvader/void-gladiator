/**
 * Sprite definitions for game entities.
 *
 * All characters are chosen to be unambiguously 1-cell wide
 * on all terminals, avoiding the "East Asian Ambiguous Width" issue.
 */

import type { Sprite, SpriteCell } from './types.js';

// ── Helper to build sprites from ASCII art ───────────────────────────

const C = (
  char: string,
  color?: string,
  opts?: { bold?: boolean; dim?: boolean; bgColor?: string }
): SpriteCell => ({
  char,
  color,
  ...opts,
});

// Transparent cell
const _ = null;

// ── Player sprites (3×3) ────────────────────────────────────────────
// Each player has a unique shape. Color is applied at render time
// based on the player's assigned color from content.

const PLAYER_SPRITE_DEFS: { cells: (SpriteCell | null)[][] }[] = [
  // Player 0 — diamond warrior
  {
    cells: [
      [_, C('/', undefined, { bold: true }), _],
      [C('['), C('@', undefined, { bold: true }), C(']')],
      [_, C('T', undefined, { dim: true }), _],
    ],
  },
  // Player 1 — arcane mage
  {
    cells: [
      [_, C('^', undefined, { bold: true }), _],
      [C('{'), C('#', undefined, { bold: true }), C('}')],
      [_, C('A', undefined, { dim: true }), _],
    ],
  },
  // Player 2 — golden knight
  {
    cells: [
      [_, C('*', undefined, { bold: true }), _],
      [C('('), C('%', undefined, { bold: true }), C(')')],
      [_, C('V', undefined, { dim: true }), _],
    ],
  },
  // Player 3 — jade guardian
  {
    cells: [
      [_, C('+', undefined, { bold: true }), _],
      [C('<'), C('&', undefined, { bold: true }), C('>')],
      [_, C('Y', undefined, { dim: true }), _],
    ],
  },
];

export const getPlayerSprite = (playerId: number): Sprite => {
  const def = PLAYER_SPRITE_DEFS[playerId % PLAYER_SPRITE_DEFS.length];
  return {
    width: 3,
    height: 3,
    cells: def.cells,
    originX: 1,
    originY: 1,
  };
};

// ── Enemy sprites ───────────────────────────────────────────────────

const ENEMY_SPRITES: Record<string, Sprite> = {
  // Shardling — small, fast, diamond-shaped
  shardling: {
    width: 1,
    height: 1,
    cells: [[C('x', 'red', { bold: true })]],
    originX: 0,
    originY: 0,
  },
  // Voidcrawler — slow, tanky, 2×1 horizontal
  voidcrawler: {
    width: 2,
    height: 1,
    cells: [[C('[', 'magenta', { bold: true }), C(']', 'magenta', { bold: true })]],
    originX: 0,
    originY: 0,
  },
  // Wraith — phasing, ghostly 1×2 vertical
  wraith: {
    width: 1,
    height: 2,
    cells: [
      [C('^', 'cyan', { dim: true })],
      [C('o', 'cyan')],
    ],
    originX: 0,
    originY: 1,
  },
  // Sentinel — armored, 2×2 block
  sentinel: {
    width: 2,
    height: 2,
    cells: [
      [C('/', 'yellow', { bold: true }), C('\\', 'yellow', { bold: true })],
      [C('\\', 'yellow'), C('/', 'yellow')],
    ],
    originX: 0,
    originY: 0,
  },
  // Spitter — ranged enemy, spiky look
  spitter: {
    width: 1,
    height: 1,
    cells: [[C('*', 'green', { bold: true })]],
    originX: 0,
    originY: 0,
  },
};

export const getEnemySprite = (kind: string): Sprite =>
  ENEMY_SPRITES[kind] ?? ENEMY_SPRITES['shardling'];

// ── Projectile sprites ──────────────────────────────────────────────

const PROJ_GLYPHS: Record<string, string> = {
  up: '|',
  down: '|',
  left: '-',
  right: '-',
};

export const getProjectileGlyph = (direction: string): string =>
  PROJ_GLYPHS[direction] ?? '*';

// ── Special projectile glyphs ───────────────────────────────────────

export const SPECIAL_PROJ_GLYPHS: Record<string, string> = {
  up: '!',
  down: '!',
  left: '=',
  right: '=',
};

// ── Pickup sprites ──────────────────────────────────────────────────

export const PICKUP_SPRITES: Record<string, Sprite> = {
  health: {
    width: 1,
    height: 1,
    cells: [[C('+', 'green', { bold: true })]],
    originX: 0,
    originY: 0,
  },
  shield: {
    width: 1,
    height: 1,
    cells: [[C('O', 'cyan', { bold: true })]],
    originX: 0,
    originY: 0,
  },
  speed: {
    width: 1,
    height: 1,
    cells: [[C('>', 'yellow', { bold: true })]],
    originX: 0,
    originY: 0,
  },
  damage: {
    width: 1,
    height: 1,
    cells: [[C('!', 'red', { bold: true })]],
    originX: 0,
    originY: 0,
  },
};

// ── Dead player marker ──────────────────────────────────────────────

export const DEAD_MARKER: Sprite = {
  width: 1,
  height: 1,
  cells: [[C('X', undefined, { dim: true })]],
  originX: 0,
  originY: 0,
};
