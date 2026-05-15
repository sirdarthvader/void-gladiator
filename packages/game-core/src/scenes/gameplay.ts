import type { AppState, GameplayScene } from '../types/app-state.js';
import type { GameplayState } from '../types/gameplay-state.js';
import type { PlayerState } from '../types/entities.js';
import type { GameCommand } from '@void-gladiator/protocol';
import type { GameModeId } from '@void-gladiator/content';
import {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  GAME_MODES,
  PLAYER_MAX_HEALTH,
  PLAYER_VISUALS,
  PLAYER_RESPAWN_TICKS,
  SANDBOX_SPAWN_INTERVAL_TICKS,
} from '@void-gladiator/content';
import { resolvePlayerInput } from '../systems/movement.js';
import { processFireCommand } from '../systems/weapons.js';
import { updateProjectiles } from '../systems/projectiles.js';
import { updateEnemyAI } from '../systems/enemy-ai.js';
import {
  resolveProjectileEnemyCollisions,
  resolveProjectilePlayerCollisions,
  resolveEnemyContact,
} from '../systems/collision.js';
import { tickCooldowns } from '../systems/cooldowns.js';
import { sandboxAutoSpawn } from '../systems/spawning.js';

/**
 * Spawn positions for players — corners of the arena.
 */
const SPAWN_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 3, y: 3 },
  { x: ARENA_WIDTH - 4, y: 3 },
  { x: 3, y: ARENA_HEIGHT - 4 },
  { x: ARENA_WIDTH - 4, y: ARENA_HEIGHT - 4 },
];

/**
 * Create a fresh PlayerState for a given slot.
 */
const createPlayer = (id: number, _name: string): PlayerState => {
  const visual = PLAYER_VISUALS[id % PLAYER_VISUALS.length];
  const spawn = SPAWN_POSITIONS[id % SPAWN_POSITIONS.length];
  return {
    id,
    x: spawn.x,
    y: spawn.y,
    glyph: visual.glyph,
    facing: 'right',
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    fireCooldown: 0,
    invincibilityTicks: 0,
    status: 'alive',
    respawnTimer: 0,
    score: 0,
    kills: 0,
    deaths: 0,
    streak: 0,
    streakTimer: 0,
    roundWins: 0,
  };
};

/**
 * Create the initial gameplay state for a new match.
 */
export const createGameplayState = (
  mode: GameModeId,
  playerInfos: readonly { id: number; name: string }[]
): GameplayState => {
  const modeConfig = GAME_MODES[mode];
  const players = playerInfos.map((info) => createPlayer(info.id, info.name));

  return {
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    players,
    projectiles: [],
    enemies: [],
    tick: 0,
    nextEntityId: 1,
    mode,

    // Wave tracking
    wave: 1,
    waveEnemiesRemaining: 0,
    waveCleared: false,
    waveClearTick: 0,

    // Round tracking
    round: 1,
    roundOver: false,
    roundWinnerId: null,

    // Team lives
    teamLives: modeConfig.livesPerPlayer * players.length,

    // Match state
    matchOver: false,
    matchWinnerId: null,

    // Sandbox auto-spawn
    spawnTimer: SANDBOX_SPAWN_INTERVAL_TICKS,
  };
};

/**
 * Handle respawn logic for dead players (co-op mode).
 */
const processRespawns = (state: GameplayState): GameplayState => {
  const modeConfig = GAME_MODES[state.mode];
  if (!modeConfig.canRespawn) return state;

  let teamLives = state.teamLives;
  const players = state.players.map((player) => {
    if (player.status !== 'dead') return player;
    if (player.respawnTimer > 0) return player;

    // Respawn timer expired — respawn if team has lives
    if (teamLives <= 0) return player;

    teamLives -= 1;
    const spawn = SPAWN_POSITIONS[player.id % SPAWN_POSITIONS.length];
    return {
      ...player,
      x: spawn.x,
      y: spawn.y,
      health: PLAYER_MAX_HEALTH,
      status: 'alive' as const,
      invincibilityTicks: 60, // 2 seconds of spawn protection
      respawnTimer: 0,
    };
  });

  return { ...state, players, teamLives };
};

/**
 * Set respawn timer on newly dead players.
 * Only sets timer if the mode allows respawn and team has lives remaining.
 */
const initRespawnTimers = (state: GameplayState): GameplayState => {
  const modeConfig = GAME_MODES[state.mode];
  if (!modeConfig.canRespawn) return state;
  if (state.teamLives <= 0) return state;

  const players = state.players.map((player) => {
    if (
      player.status === 'dead' &&
      player.respawnTimer === 0 &&
      player.health <= 0
    ) {
      return { ...player, respawnTimer: PLAYER_RESPAWN_TICKS };
    }
    return player;
  });

  return { ...state, players };
};

/**
 * Check round-over conditions for Void Duel.
 */
const checkRoundOver = (state: GameplayState): GameplayState => {
  const modeConfig = GAME_MODES[state.mode];
  if (!modeConfig.hasRounds || state.roundOver) return state;

  const alivePlayers = state.players.filter((p) => p.status === 'alive');

  if (alivePlayers.length <= 1) {
    const winnerId = alivePlayers.length === 1 ? alivePlayers[0].id : null;
    const players = state.players.map((p) =>
      p.id === winnerId ? { ...p, roundWins: p.roundWins + 1 } : p
    );
    return { ...state, roundOver: true, roundWinnerId: winnerId, players };
  }

  return state;
};

/**
 * Check match-over conditions.
 */
const checkMatchOver = (state: GameplayState): GameplayState => {
  if (state.matchOver) return state;
  const modeConfig = GAME_MODES[state.mode];

  if (modeConfig.hasRounds) {
    // Void Duel: check if someone has enough round wins
    const winner = state.players.find(
      (p) => p.roundWins >= modeConfig.roundsToWin
    );
    if (winner) {
      return { ...state, matchOver: true, matchWinnerId: winner.id };
    }
  } else {
    // Void Storm: match over when team lives depleted and all dead
    const allDead = state.players.every((p) => p.status === 'dead');
    if (allDead && state.teamLives <= 0) {
      return { ...state, matchOver: true, matchWinnerId: null };
    }
  }

  return state;
};

/**
 * Tick the gameplay scene.
 * Processes per-player commands, then runs the simulation pipeline.
 */
export const tickGameplay = (
  state: GameplayScene,
  commandsByPlayer: ReadonlyMap<number, readonly GameCommand[]>
): AppState => {
  let gs = state.gameplay;
  if (gs.matchOver) {
    // Transition to results when match ends
    return {
      scene: 'results',
      results: {
        mode: gs.mode,
        winnerId: gs.matchWinnerId,
        players: gs.players.map((p) => ({
          id: p.id,
          name: `Player ${p.id + 1}`,
          score: p.score,
          kills: p.kills,
          deaths: p.deaths,
          bestStreak: p.streak,
          roundWins: p.roundWins,
        })),
        displayTick: 0,
      },
    };
  }

  const modeConfig = GAME_MODES[gs.mode];

  // 1. Resolve input for each player
  for (const [playerId, commands] of commandsByPlayer) {
    const playerIdx = gs.players.findIndex((p) => p.id === playerId);
    if (playerIdx === -1) continue;

    const player = gs.players[playerIdx];
    if (player.status !== 'alive') continue;

    const { player: movedPlayer, fireRequested } = resolvePlayerInput(
      player,
      commands,
      gs.arenaWidth,
      gs.arenaHeight
    );

    const updatedPlayers = [...gs.players];
    updatedPlayers[playerIdx] = movedPlayer;
    gs = { ...gs, players: updatedPlayers };

    // 2. Process weapon triggers
    gs = processFireCommand(gs, playerId, fireRequested);
  }

  // 3. Update enemy AI
  gs = updateEnemyAI(gs);

  // 4. Move projectiles
  gs = updateProjectiles(gs);

  // 5. Resolve collisions (projectile-enemy)
  gs = resolveProjectileEnemyCollisions(gs);

  // 5b. Resolve PvP collisions
  gs = resolveProjectilePlayerCollisions(gs, modeConfig.friendlyFire);

  // 6. Resolve enemy-player contact damage
  gs = resolveEnemyContact(gs);

  // 7. Process respawns (timer expired → respawn if lives remain)
  gs = processRespawns(gs);

  // 8. Init respawn timers for newly dead players
  gs = initRespawnTimers(gs);

  // 9. Tick cooldowns
  gs = tickCooldowns(gs);

  // 10. Sandbox auto-spawn (waves TBD — using sandbox for now)
  if (modeConfig.hasWaves) {
    gs = sandboxAutoSpawn(gs);
  }

  // 11. Check round/match over
  gs = checkRoundOver(gs);
  gs = checkMatchOver(gs);

  // 12. Increment tick
  gs = { ...gs, tick: gs.tick + 1 };

  return { ...state, gameplay: gs };
};
