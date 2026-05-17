export { createEnhancedRenderer } from './renderer.js';
export type { Renderer, Sprite, SpriteCell } from './types.js';
export type {
  RenderState,
  Particle,
  HitMarker,
  ScreenShake,
  ScreenFlash,
} from './render-state.js';
export { createRenderState, tickRenderState } from './render-state.js';
export type { AmbienceState, StarfieldState } from './ambience.js';
export type { TransitionState } from './transitions.js';
export type { VisualConfig } from './visual-config.js';
export { loadVisualConfig } from './visual-config.js';
export type { PlayerPalette } from './palettes.js';
export {
  healthGradient256,
  energyGradient256,
  fireGradient256,
  voidGradient256,
  streakGradient256,
  PLAYER_PALETTES,
} from './palettes.js';
