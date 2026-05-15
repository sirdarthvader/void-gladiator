// ANSI escape sequences
export const RESET = '\x1b[0m';
export const BOLD = '\x1b[1m';
export const DIM = '\x1b[2m';

// Foreground colors
export const RED = '\x1b[31m';
export const GREEN = '\x1b[32m';
export const YELLOW = '\x1b[33m';
export const CYAN = '\x1b[36m';
export const WHITE_BRIGHT = '\x1b[97m';
export const CYAN_BRIGHT = '\x1b[96m';

// Box-drawing characters
export const BOX_TOP_LEFT = '╔';
export const BOX_TOP_RIGHT = '╗';
export const BOX_BOTTOM_LEFT = '╚';
export const BOX_BOTTOM_RIGHT = '╝';
export const BOX_HORIZONTAL = '═';
export const BOX_VERTICAL = '║';

// Projectile glyphs. Box-drawing chars have East Asian "Ambiguous" width,
// but most terminals render the box-drawing block at 1 cell.
export const PROJ_HORIZONTAL = '─';
export const PROJ_VERTICAL = '│';
