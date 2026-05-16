/**
 * Color constants and attribute helpers for the enhanced renderer.
 * Uses terminal-kit's 256-color palette names/indices.
 */

import type { ScreenBuffer } from 'terminal-kit';

type Attr = ScreenBuffer.Attributes;

// ── Named attribute presets ──────────────────────────────────────────

export const ATTR_DEFAULT: Attr = { color: 'white', bgColor: 'black' };
export const ATTR_DIM: Attr = { color: 'white', bgColor: 'black', dim: true };
export const ATTR_BORDER: Attr = { color: 240, bgColor: 'black', dim: true };
export const ATTR_HUD_TITLE: Attr = { color: 'cyan', bgColor: 'black', bold: true };
export const ATTR_HUD_DIM: Attr = { color: 'white', bgColor: 'black', dim: true };

// ── Player color → attribute mapping ─────────────────────────────────

const PLAYER_ATTRS: Record<string, Attr> = {
  cyan: { color: 'cyan', bold: true },
  magenta: { color: 'magenta', bold: true },
  yellow: { color: 'yellow', bold: true },
  green: { color: 'green', bold: true },
  red: { color: 'red', bold: true },
  blue: { color: 'blue', bold: true },
  white: { color: 'white', bold: true },
};

export const playerAttr = (color: string): Attr =>
  PLAYER_ATTRS[color] ?? { color: 'white', bold: true };

// ── Health bar colors ────────────────────────────────────────────────

export const healthColor = (health: number): string =>
  health > 2 ? 'green' : health > 1 ? 'yellow' : 'red';

// ── Arena floor styling ──────────────────────────────────────────────

export const ATTR_FLOOR: Attr = { color: 235, bgColor: 232 };
export const ATTR_FLOOR_DOT: Attr = { color: 236, bgColor: 232 };
