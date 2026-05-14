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
export { spawnEnemy as spawnEnemyMultiplayer } from './systems/spawning.js';

// --- Top-level tick ---
export { tickApp } from './tick.js';
export type { AppTickInput } from './tick.js';

// ============================================================
// Legacy API — backward compatibility for existing tests.
// Maps the old single-player interface onto the new multi-player internals.
// ============================================================

import type { GameCommand } from '@void-gladiator/protocol';
import type { GameplayState } from './types/index.js';
import type { Direction } from '@void-gladiator/shared';
import { createGameplayState } from './scenes/gameplay.js';
import { tickApp } from './tick.js';
import { spawnEnemy as spawnEnemyInternal } from './systems/spawning.js';
import type { EnemyKind } from '@void-gladiator/content';

/**
 * @deprecated Use AppState + tickApp instead.
 * Legacy single-player GameState shape for test compatibility.
 */
export interface GameState {
  title: string;
  arenaWidth: number;
  arenaHeight: number;
  player: {
    x: number;
    y: number;
    glyph: string;
    facing: Direction;
    health: number;
    maxHealth: number;
    fireCooldown: number;
    invincibilityTicks: number;
  };
  projectiles: Array<{
    id: number;
    x: number;
    y: number;
    direction: Direction;
    speed: number;
    owner: 'player' | 'enemy';
    lifetime: number;
  }>;
  enemies: Array<{
    id: number;
    x: number;
    y: number;
    kind: EnemyKind;
    glyph: string;
    health: number;
    speed: number;
    damage: number;
    moveAccumulator: number;
  }>;
  tick: number;
  nextEntityId: number;
  gameOver: boolean;
  spawnTimer: number;
}

export interface TickInput {
  commands: readonly GameCommand[];
}

/**
 * @deprecated Use createGameplayState() instead.
 * Creates a legacy single-player GameState.
 */
export const createInitialGameState = (): GameState => {
  const gs = createGameplayState('void_storm', [{ id: 0, name: 'Player 1' }]);
  // Override: place player at center (legacy behavior)
  const centered = {
    ...gs,
    players: [{
      ...gs.players[0],
      x: Math.floor(gs.arenaWidth / 2),
      y: Math.floor(gs.arenaHeight / 2),
    }],
    // Disable respawns in legacy mode
    teamLives: 0,
  };
  return gameplayToLegacy(centered);
};

/**
 * @deprecated Use tickApp() instead.
 * Ticks the legacy single-player game state.
 */
export const tickGameState = (state: GameState, input: TickInput): GameState => {
  const gs = legacyToGameplay(state);
  const commandsByPlayer = new Map<number, readonly GameCommand[]>();
  commandsByPlayer.set(0, input.commands);

  const result = tickApp(
    { scene: 'gameplay', gameplay: gs },
    { commandsByPlayer }
  );

  if (result.scene === 'gameplay') {
    return gameplayToLegacy(result.gameplay);
  }

  // If we transitioned out (results), return game over state
  return { ...state, gameOver: true };
};

/**
 * @deprecated
 */
export const applyCommand = (state: GameState, command: GameCommand): GameState => {
  return tickGameState(state, { commands: [command] });
};

/**
 * @deprecated
 */
export const applyCommands = (state: GameState, commands: readonly GameCommand[]): GameState => {
  return tickGameState(state, { commands });
};

/**
 * @deprecated Use spawnEnemy on GameplayState directly.
 */
export const spawnEnemyLegacy = (state: GameState, kind: EnemyKind): GameState => {
  const gs = legacyToGameplay(state);
  const spawned = spawnEnemyInternal(gs, kind);
  return gameplayToLegacy(spawned);
};

// Re-export spawnEnemy under legacy name for tests
export { spawnEnemyLegacy as spawnEnemy };

// --- Conversion helpers ---

const gameplayToLegacy = (gs: GameplayState): GameState => {
  const player = gs.players[0];
  return {
    title: 'Void Gladiator',
    arenaWidth: gs.arenaWidth,
    arenaHeight: gs.arenaHeight,
    player: {
      x: player.x,
      y: player.y,
      glyph: player.glyph,
      facing: player.facing,
      health: player.health,
      maxHealth: player.maxHealth,
      fireCooldown: player.fireCooldown,
      invincibilityTicks: player.invincibilityTicks,
    },
    projectiles: gs.projectiles.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      direction: p.direction,
      speed: p.speed,
      owner: p.ownerId >= 0 ? 'player' as const : 'enemy' as const,
      lifetime: p.lifetime,
    })),
    enemies: gs.enemies.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      kind: e.kind,
      glyph: e.glyph,
      health: e.health,
      speed: e.speed,
      damage: e.damage,
      moveAccumulator: e.moveAccumulator,
    })),
    tick: gs.tick,
    nextEntityId: gs.nextEntityId,
    gameOver: gs.matchOver || gs.players[0].status === 'dead',
    spawnTimer: gs.spawnTimer,
  };
};

const legacyToGameplay = (state: GameState): GameplayState => {
  return {
    arenaWidth: state.arenaWidth,
    arenaHeight: state.arenaHeight,
    players: [
      {
        id: 0,
        x: state.player.x,
        y: state.player.y,
        glyph: state.player.glyph,
        facing: state.player.facing,
        health: state.player.health,
        maxHealth: state.player.maxHealth,
        fireCooldown: state.player.fireCooldown,
        invincibilityTicks: state.player.invincibilityTicks,
        status: state.gameOver ? 'dead' : 'alive',
        respawnTimer: 0,
        score: 0,
        kills: 0,
        deaths: 0,
        streak: 0,
        streakTimer: 0,
        roundWins: 0,
      },
    ],
    projectiles: state.projectiles.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      direction: p.direction,
      speed: p.speed,
      ownerId: p.owner === 'player' ? 0 : -1,
      lifetime: p.lifetime,
    })),
    enemies: state.enemies.map((e) => ({
      id: e.id,
      x: e.x,
      y: e.y,
      kind: e.kind,
      glyph: e.glyph,
      health: e.health,
      speed: e.speed,
      damage: e.damage,
      moveAccumulator: e.moveAccumulator,
      targetPlayerId: 0,
    })),
    tick: state.tick,
    nextEntityId: state.nextEntityId,
    mode: 'void_storm',
    wave: 1,
    waveEnemiesRemaining: 0,
    waveCleared: false,
    waveClearTick: 0,
    round: 1,
    roundOver: false,
    roundWinnerId: null,
    teamLives: 0,
    matchOver: state.gameOver,
    matchWinnerId: null,
    spawnTimer: state.spawnTimer,
  };
};
