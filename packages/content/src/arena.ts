export const GAME_TITLE = 'Void Gladiator';
export const MAX_PLAYERS = 4;

// Fixed simulation arena size — identical for all players in multiplayer.
// Renderers center this within whatever terminal size is available.
export const ARENA_WIDTH = 72;
export const ARENA_HEIGHT = 30;

// Margins: terminal rows/columns consumed by UI chrome (borders, HUD, status bar).
export const ARENA_MARGIN_X = 2; // left + right border
export const ARENA_MARGIN_Y = 4; // HUD row + top border + bottom border + status bar

/**
 * Check whether the terminal is large enough to display the arena.
 */
export const isTerminalTooSmall = (
  terminalCols: number,
  terminalRows: number
): boolean =>
  terminalCols < ARENA_WIDTH + ARENA_MARGIN_X ||
  terminalRows < ARENA_HEIGHT + ARENA_MARGIN_Y;
