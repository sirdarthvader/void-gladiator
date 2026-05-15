// --- Types ---
export type {
  PlayerState,
  PlayerStatus,
  Projectile,
  Enemy,
  GameplayState,
  LobbyState,
  LobbyPlayer,
  ResultsState,
  PlayerResult,
  AppState,
  TitleScene,
  LobbyScene,
  GameplayScene,
  ResultsScene,
} from './types/index.js';

// --- Scenes ---
export {
  createTitleState,
  tickTitle,
  createLobbyState,
  addPlayerToLobby,
  tickLobby,
  createGameplayState,
  tickGameplay,
  tickResults,
} from './scenes/index.js';

// --- Systems ---
export { spawnEnemy } from './systems/spawning.js';

// --- Top-level tick ---
export { tickApp } from './tick.js';
export type { AppTickInput } from './tick.js';
