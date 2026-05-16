export const PLAYER_MAX_HEALTH = 5;
export const PLAYER_FIRE_COOLDOWN_TICKS = 6; // ~200ms at 30Hz
export const PLAYER_INVINCIBILITY_TICKS = 15; // ~0.5s at 30Hz
export const PLAYER_RESPAWN_TICKS = 90; // 3 seconds at 30Hz

/**
 * Glyphs and colors per player slot (0-indexed).
 * `color` is a named color string (renderer-agnostic).
 */
export interface PlayerVisual {
  glyph: string;
  color: string;
  name: string;
}

export const PLAYER_VISUALS: readonly PlayerVisual[] = [
  { glyph: '◆', color: 'cyan', name: 'Cyan' },
  { glyph: '◇', color: 'magenta', name: 'Magenta' },
  { glyph: '◈', color: 'yellow', name: 'Gold' },
  { glyph: '▣', color: 'green', name: 'Jade' },
];
