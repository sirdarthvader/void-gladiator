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
  MatchmakingScene,
  MatchmakingState,
  MatchmakingPeer,
  ChatLine,
  ChatInput,
  StartEnvelope,
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
  createMatchmakingState,
  tickMatchmaking,
} from './scenes/index.js';
export type { MatchmakingNetworkPatch } from './scenes/index.js';

// --- Systems ---
export { spawnEnemy } from './systems/spawning.js';

// --- Top-level tick ---
export { tickApp } from './tick.js';
export type { AppTickInput } from './tick.js';
