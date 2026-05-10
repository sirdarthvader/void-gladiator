import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  ENEMY_DEFINITIONS,
  GAME_TITLE,
  PLAYER_FIRE_COOLDOWN_TICKS,
  PLAYER_MAX_HEALTH,
  PROJECTILE_LIFETIME_TICKS,
  PROJECTILE_SPEED,
  SANDBOX_MAX_ENEMIES,
  SANDBOX_SPAWN_INTERVAL_TICKS,
} from '@void-gladiator/content';
import type { EnemyKind } from '@void-gladiator/content';
import type { GameCommand } from '@void-gladiator/protocol';
import { clamp, DIRECTION_VECTORS } from '@void-gladiator/shared';
import type { Direction } from '@void-gladiator/shared';

// --- Entity types ---

export interface PlayerState {
  x: number;
  y: number;
  glyph: string;
  facing: Direction;
  health: number;
  maxHealth: number;
  fireCooldown: number;
  invincibilityTicks: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  owner: 'player' | 'enemy';
  lifetime: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  kind: EnemyKind;
  glyph: string;
  health: number;
  speed: number;
  damage: number;
  moveAccumulator: number;
}

// --- Game state ---

export interface GameState {
  title: string;
  arenaWidth: number;
  arenaHeight: number;
  player: PlayerState;
  projectiles: Projectile[];
  enemies: Enemy[];
  tick: number;
  nextEntityId: number;
  gameOver: boolean;
  spawnTimer: number;
}

// --- Factory ---

export const createInitialGameState = (): GameState => {
  return {
    title: GAME_TITLE,
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    player: {
      x: Math.floor(ARENA_WIDTH / 2),
      y: Math.floor(ARENA_HEIGHT / 2),
      glyph: '@',
      facing: 'right',
      health: PLAYER_MAX_HEALTH,
      maxHealth: PLAYER_MAX_HEALTH,
      fireCooldown: 0,
      invincibilityTicks: 0,
    },
    projectiles: [],
    enemies: [],
    tick: 0,
    nextEntityId: 1,
    gameOver: false,
    spawnTimer: SANDBOX_SPAWN_INTERVAL_TICKS,
  };
};

// --- Systems ---

const MOVEMENT_COMMANDS: Record<string, Direction> = {
  move_up: 'up',
  move_down: 'down',
  move_left: 'left',
  move_right: 'right',
};

export interface TickInput {
  commands: readonly GameCommand[];
}

/** Resolve input commands into player movement, facing, and action triggers */
const resolvePlayerInput = (
  player: PlayerState,
  commands: readonly GameCommand[],
  arenaWidth: number,
  arenaHeight: number
): { player: PlayerState; fireRequested: boolean } => {
  let nextPlayer = { ...player };
  let fireRequested = false;

  for (const command of commands) {
    const dir = MOVEMENT_COMMANDS[command];
    if (dir) {
      const vec = DIRECTION_VECTORS[dir];
      nextPlayer = {
        ...nextPlayer,
        x: clamp(nextPlayer.x + vec.x, 0, arenaWidth - 1),
        y: clamp(nextPlayer.y + vec.y, 0, arenaHeight - 1),
        facing: dir,
      };
    } else if (command === 'fire') {
      fireRequested = true;
    }
  }

  return { player: nextPlayer, fireRequested };
};

/** Spawn a projectile from the player if cooldown allows */
const processFireCommand = (
  state: GameState,
  fireRequested: boolean
): GameState => {
  if (!fireRequested || state.player.fireCooldown > 0) {
    return state;
  }

  const vec = DIRECTION_VECTORS[state.player.facing];
  const projectile: Projectile = {
    id: state.nextEntityId,
    x: state.player.x + vec.x,
    y: state.player.y + vec.y,
    direction: state.player.facing,
    speed: PROJECTILE_SPEED,
    owner: 'player',
    lifetime: PROJECTILE_LIFETIME_TICKS,
  };

  return {
    ...state,
    player: { ...state.player, fireCooldown: PLAYER_FIRE_COOLDOWN_TICKS },
    projectiles: [...state.projectiles, projectile],
    nextEntityId: state.nextEntityId + 1,
  };
};

/** Move all projectiles and remove expired / out-of-bounds ones */
const updateProjectiles = (state: GameState): GameState => {
  const alive: Projectile[] = [];

  for (const proj of state.projectiles) {
    const vec = DIRECTION_VECTORS[proj.direction];
    const nx = proj.x + vec.x * proj.speed;
    const ny = proj.y + vec.y * proj.speed;
    const remainingLife = proj.lifetime - 1;

    if (
      remainingLife <= 0 ||
      nx < 0 ||
      nx >= state.arenaWidth ||
      ny < 0 ||
      ny >= state.arenaHeight
    ) {
      continue;
    }

    alive.push({ ...proj, x: nx, y: ny, lifetime: remainingLife });
  }

  return { ...state, projectiles: alive };
};

/** Simple Shardling AI: move toward the player */
const updateEnemyAI = (state: GameState): GameState => {
  const { player } = state;
  const movedEnemies = state.enemies.map((enemy) => {
    const acc = enemy.moveAccumulator + enemy.speed;
    if (acc < 1) {
      return { ...enemy, moveAccumulator: acc };
    }

    const steps = Math.floor(acc);
    let { x, y } = enemy;
    for (let i = 0; i < steps; i++) {
      const dx = player.x - x;
      const dy = player.y - y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        x += dx > 0 ? 1 : -1;
      } else {
        y += dy > 0 ? 1 : -1;
      }
      x = clamp(x, 0, state.arenaWidth - 1);
      y = clamp(y, 0, state.arenaHeight - 1);
    }
    return { ...enemy, x, y, moveAccumulator: acc - steps };
  });

  return { ...state, enemies: movedEnemies };
};

/** Detect collisions between player projectiles and enemies */
const resolveCollisions = (state: GameState): GameState => {
  const survivingProjectiles: Projectile[] = [];
  let enemies = state.enemies.map((e) => ({ ...e }));

  for (const proj of state.projectiles) {
    if (proj.owner !== 'player') {
      survivingProjectiles.push(proj);
      continue;
    }

    let hit = false;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (Math.abs(proj.x - e.x) < 1 && Math.abs(proj.y - e.y) < 1) {
        enemies[i] = { ...e, health: e.health - 1 };
        hit = true;
        break;
      }
    }

    if (!hit) {
      survivingProjectiles.push(proj);
    }
  }

  // Remove dead enemies
  const aliveEnemies = enemies.filter((e) => e.health > 0);

  return { ...state, projectiles: survivingProjectiles, enemies: aliveEnemies };
};

/** Handle enemy-to-player contact damage */
const resolveEnemyContact = (state: GameState): GameState => {
  if (state.player.invincibilityTicks > 0) {
    return state;
  }

  let damage = 0;
  for (const enemy of state.enemies) {
    if (
      Math.abs(enemy.x - state.player.x) < 1 &&
      Math.abs(enemy.y - state.player.y) < 1
    ) {
      damage += enemy.damage;
    }
  }

  if (damage === 0) {
    return state;
  }

  const newHealth = Math.max(0, state.player.health - damage);
  return {
    ...state,
    player: {
      ...state.player,
      health: newHealth,
      invincibilityTicks: 15, // ~0.5s at 30Hz
    },
    gameOver: newHealth <= 0,
  };
};

/** Tick down cooldowns and invincibility */
const tickCooldowns = (state: GameState): GameState => {
  return {
    ...state,
    player: {
      ...state.player,
      fireCooldown: Math.max(0, state.player.fireCooldown - 1),
      invincibilityTicks: Math.max(0, state.player.invincibilityTicks - 1),
    },
  };
};

/** Spawn enemy at a random arena edge */
export const spawnEnemy = (state: GameState, kind: EnemyKind): GameState => {
  const def = ENEMY_DEFINITIONS[kind];
  const edge = Math.floor(Math.random() * 4);
  let x: number;
  let y: number;

  switch (edge) {
    case 0: // top
      x = Math.floor(Math.random() * state.arenaWidth);
      y = 0;
      break;
    case 1: // bottom
      x = Math.floor(Math.random() * state.arenaWidth);
      y = state.arenaHeight - 1;
      break;
    case 2: // left
      x = 0;
      y = Math.floor(Math.random() * state.arenaHeight);
      break;
    default: // right
      x = state.arenaWidth - 1;
      y = Math.floor(Math.random() * state.arenaHeight);
      break;
  }

  const enemy: Enemy = {
    id: state.nextEntityId,
    x,
    y,
    kind: def.kind,
    glyph: def.glyph,
    health: def.health,
    speed: def.speed,
    damage: def.damage,
    moveAccumulator: 0,
  };

  return {
    ...state,
    enemies: [...state.enemies, enemy],
    nextEntityId: state.nextEntityId + 1,
  };
};

/** Sandbox auto-spawner for milestone 2 testing */
const sandboxAutoSpawn = (state: GameState): GameState => {
  const nextTimer = state.spawnTimer - 1;

  if (nextTimer > 0 || state.enemies.length >= SANDBOX_MAX_ENEMIES) {
    return {
      ...state,
      spawnTimer: nextTimer > 0 ? nextTimer : state.spawnTimer,
    };
  }

  const spawned = spawnEnemy(state, 'shardling');
  return { ...spawned, spawnTimer: SANDBOX_SPAWN_INTERVAL_TICKS };
};

// --- Main tick function ---

/**
 * Advance the game by one tick given the input commands.
 * Follows the per-tick pipeline order from TECH_ARCHITECTURE.md.
 */
export const tickGameState = (
  state: GameState,
  input: TickInput
): GameState => {
  if (state.gameOver) {
    return state;
  }

  // 1. Resolve input → player intent
  const { player: movedPlayer, fireRequested } = resolvePlayerInput(
    state.player,
    input.commands,
    state.arenaWidth,
    state.arenaHeight
  );
  let next: GameState = { ...state, player: movedPlayer };

  // 2. Process weapon triggers
  next = processFireCommand(next, fireRequested);

  // 3. Update enemy AI
  next = updateEnemyAI(next);

  // 4. Move projectiles
  next = updateProjectiles(next);

  // 5. Resolve collisions (projectile-enemy)
  next = resolveCollisions(next);

  // 6. Resolve enemy-player contact damage
  next = resolveEnemyContact(next);

  // 7. Tick cooldowns
  next = tickCooldowns(next);

  // 8. Sandbox auto-spawn
  next = sandboxAutoSpawn(next);

  // 9. Increment tick
  next = { ...next, tick: next.tick + 1 };

  return next;
};

// --- Legacy helpers (kept for test compatibility) ---

export const applyCommand = (
  state: GameState,
  command: GameCommand
): GameState => {
  return tickGameState(state, { commands: [command] });
};

export const applyCommands = (
  state: GameState,
  commands: readonly GameCommand[]
): GameState => {
  return tickGameState(state, { commands });
};
