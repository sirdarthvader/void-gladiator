import type { LobbyState } from './lobby-state.js';
import type { GameplayState } from './gameplay-state.js';
import type { ResultsState } from './results-state.js';

/**
 * Title scene — the initial splash screen.
 */
export interface TitleScene {
  scene: 'title';
  animationTick: number;
}

/**
 * Lobby scene — player connection and mode selection.
 */
export interface LobbyScene {
  scene: 'lobby';
  lobby: LobbyState;
}

/**
 * Gameplay scene — the active arena.
 */
export interface GameplayScene {
  scene: 'gameplay';
  gameplay: GameplayState;
}

/**
 * Results scene — post-match summary.
 */
export interface ResultsScene {
  scene: 'results';
  results: ResultsState;
}

/**
 * The top-level application state — a discriminated union of scenes.
 * The renderer and tick function switch on `state.scene` to determine behavior.
 */
export type AppState = TitleScene | LobbyScene | GameplayScene | ResultsScene;
