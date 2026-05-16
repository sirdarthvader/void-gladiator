import type { LobbyState } from './lobby-state.js';
import type { GameplayState } from './gameplay-state.js';
import type { ResultsState } from './results-state.js';

/**
 * Title scene — the initial splash screen.
 */
export interface TitleScene {
  scene: 'title';
  arenaWidth: number;
  arenaHeight: number;
  animationTick: number;
}

/**
 * Lobby scene — player connection and mode selection.
 */
export interface LobbyScene {
  scene: 'lobby';
  arenaWidth: number;
  arenaHeight: number;
  lobby: LobbyState;
}

/**
 * Gameplay scene — the active arena.
 */
export interface GameplayScene {
  scene: 'gameplay';
  arenaWidth: number;
  arenaHeight: number;
  gameplay: GameplayState;
}

/**
 * Results scene — post-match summary.
 */
export interface ResultsScene {
  scene: 'results';
  arenaWidth: number;
  arenaHeight: number;
  results: ResultsState;
}

/**
 * The top-level application state — a discriminated union of scenes.
 * The renderer and tick function switch on `state.scene` to determine behavior.
 *
 * `arenaWidth` and `arenaHeight` are available on every scene, set once
 * at startup from the terminal dimensions and carried through transitions.
 */
export type AppState = TitleScene | LobbyScene | GameplayScene | ResultsScene;
