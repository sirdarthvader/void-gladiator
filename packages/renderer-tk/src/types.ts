import type { AppState } from '@void-gladiator/game-core';

/**
 * Common renderer interface — implemented by both the classic (string-based)
 * and enhanced (terminal-kit ScreenBuffer) renderers.
 */
export interface Renderer {
  init(): void;
  render(state: AppState): void;
  cleanup(): void;
}

/**
 * A single cell within a sprite definition.
 * `null` in a sprite grid means transparent (background shows through).
 */
export interface SpriteCell {
  char: string;
  color?: string;
  bgColor?: string;
  bold?: boolean;
  dim?: boolean;
}

/**
 * A multi-cell sprite — a 2D grid of styled characters.
 * `originX`/`originY` is the cell that aligns with the entity's position.
 */
export interface Sprite {
  width: number;
  height: number;
  cells: (SpriteCell | null)[][];
  originX: number;
  originY: number;
}
