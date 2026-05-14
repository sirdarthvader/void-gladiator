export const PLAYER_MAX_HEALTH = 5;
export const PLAYER_FIRE_COOLDOWN_TICKS = 6; // ~200ms at 30Hz
export const PLAYER_INVINCIBILITY_TICKS = 15; // ~0.5s at 30Hz
export const PLAYER_RESPAWN_TICKS = 90; // 3 seconds at 30Hz

/**
 * Glyphs and colors per player slot (0-indexed).
 */
export interface PlayerVisual {
  glyph: string;
  colorCode: string;
  name: string;
}

export const PLAYER_VISUALS: readonly PlayerVisual[] = [
  { glyph: '◆', colorCode: '\x1b[36m', name: 'Cyan' },
  { glyph: '◇', colorCode: '\x1b[35m', name: 'Magenta' },
  { glyph: '◈', colorCode: '\x1b[33m', name: 'Gold' },
  { glyph: '▣', colorCode: '\x1b[32m', name: 'Jade' },
];
