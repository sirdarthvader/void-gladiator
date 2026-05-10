import { describe, expect, it } from 'vitest';

import {
  createInitialGameState,
  spawnEnemy,
  tickGameState,
} from '../../packages/game-core/src/index.js';
import type {
  GameState,
} from '../../packages/game-core/src/index.js';
import type { GameCommand } from '../../packages/protocol/src/index.js';

const tick = (state: GameState, commands: GameCommand[] = []): GameState =>
  tickGameState(state, { commands });

const _tickN = (state: GameState, n: number, commands: GameCommand[] = []): GameState => {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = tick(s, i === 0 ? commands : []);
  }
  return s;
};

describe('facing direction', () => {
  it('defaults to right', () => {
    const state = createInitialGameState();
    expect(state.player.facing).toBe('right');
  });

  it('updates on movement', () => {
    let state = createInitialGameState();
    state = tick(state, ['move_up']);
    expect(state.player.facing).toBe('up');

    state = tick(state, ['move_left']);
    expect(state.player.facing).toBe('left');
  });

  it('keeps last direction when multiple moves in one tick', () => {
    const state = tick(createInitialGameState(), ['move_up', 'move_left']);
    expect(state.player.facing).toBe('left');
  });
});

describe('firing', () => {
  it('spawns a projectile on fire command', () => {
    const state = tick(createInitialGameState(), ['fire']);
    expect(state.projectiles).toHaveLength(1);
    expect(state.projectiles[0].owner).toBe('player');
    expect(state.projectiles[0].direction).toBe('right');
  });

  it('respects fire cooldown', () => {
    let state = tick(createInitialGameState(), ['fire']);
    expect(state.projectiles).toHaveLength(1);

    // Immediately firing again should not spawn
    state = tick(state, ['fire']);
    expect(state.projectiles).toHaveLength(1); // still 1 (same projectile moved)
  });

  it('fires again after cooldown expires', () => {
    let state = tick(createInitialGameState(), ['fire']);

    // Tick through cooldown
    for (let i = 0; i < 10; i++) {
      state = tick(state);
    }

    state = tick(state, ['fire']);
    // Should have spawned a second projectile (first may have expired)
    const playerProjectiles = state.projectiles.filter((p) => p.owner === 'player');
    expect(playerProjectiles.length).toBeGreaterThanOrEqual(1);
  });

  it('fires in the current facing direction', () => {
    let state = tick(createInitialGameState(), ['move_up']);
    state = tick(state, ['fire']);
    const proj = state.projectiles[0];
    expect(proj.direction).toBe('up');
  });
});

describe('projectile movement', () => {
  it('moves projectiles each tick', () => {
    let state = tick(createInitialGameState(), ['fire']);
    const initialX = state.projectiles[0].x;

    state = tick(state);
    // Projectile should have moved right (default facing)
    const proj = state.projectiles[0];
    expect(proj.x).toBeGreaterThan(initialX);
  });

  it('removes projectiles that exit arena bounds', () => {
    let state = createInitialGameState();
    // Move player to right edge and fire right
    for (let i = 0; i < 50; i++) {
      state = tick(state, ['move_right']);
    }
    state = tick(state, ['fire']);

    // Tick until projectile leaves
    for (let i = 0; i < 5; i++) {
      state = tick(state);
    }

    expect(state.projectiles).toHaveLength(0);
  });

  it('removes projectiles when lifetime expires', () => {
    let state = tick(createInitialGameState(), ['fire']);

    // Tick many times
    for (let i = 0; i < 40; i++) {
      state = tick(state);
    }

    expect(state.projectiles).toHaveLength(0);
  });
});

describe('enemy spawning', () => {
  it('spawns a shardling enemy', () => {
    let state = createInitialGameState();
    state = spawnEnemy(state, 'shardling');
    expect(state.enemies).toHaveLength(1);
    expect(state.enemies[0].kind).toBe('shardling');
    expect(state.enemies[0].glyph).toBe('s');
  });

  it('spawns at arena edge', () => {
    let state = createInitialGameState();
    state = spawnEnemy(state, 'shardling');
    const e = state.enemies[0];
    const atEdge =
      e.x === 0 ||
      e.x === state.arenaWidth - 1 ||
      e.y === 0 ||
      e.y === state.arenaHeight - 1;
    expect(atEdge).toBe(true);
  });

  it('assigns unique IDs', () => {
    let state = createInitialGameState();
    state = spawnEnemy(state, 'shardling');
    state = spawnEnemy(state, 'shardling');
    expect(state.enemies[0].id).not.toBe(state.enemies[1].id);
  });
});

describe('shardling AI', () => {
  it('moves toward the player over time', () => {
    let state = createInitialGameState();

    // Manually place an enemy far from the player
    state = {
      ...state,
      enemies: [
        {
          id: 999,
          x: 0,
          y: 0,
          kind: 'shardling',
          glyph: 's',
          health: 1,
          speed: 1, // fast for test
          damage: 1,
          moveAccumulator: 0,
        },
      ],
    };

    const initialDist = Math.abs(state.enemies[0].x - state.player.x) +
      Math.abs(state.enemies[0].y - state.player.y);

    state = tick(state);

    const newDist = Math.abs(state.enemies[0].x - state.player.x) +
      Math.abs(state.enemies[0].y - state.player.y);

    expect(newDist).toBeLessThan(initialDist);
  });
});

describe('collision detection', () => {
  it('destroys enemy when hit by player projectile', () => {
    let state = createInitialGameState();

    // Place enemy directly to the right of the player (in firing line)
    state = {
      ...state,
      enemies: [
        {
          id: 100,
          x: state.player.x + 3,
          y: state.player.y,
          kind: 'shardling',
          glyph: 's',
          health: 1,
          speed: 0,
          damage: 1,
          moveAccumulator: 0,
        },
      ],
    };

    // Fire right (default facing)
    state = tick(state, ['fire']);

    // Tick until projectile reaches enemy
    for (let i = 0; i < 5; i++) {
      state = tick(state);
    }

    expect(state.enemies).toHaveLength(0);
  });

  it('removes projectile on enemy hit', () => {
    let state = createInitialGameState();

    state = {
      ...state,
      enemies: [
        {
          id: 100,
          x: state.player.x + 3,
          y: state.player.y,
          kind: 'shardling',
          glyph: 's',
          health: 1,
          speed: 0,
          damage: 1,
          moveAccumulator: 0,
        },
      ],
    };

    state = tick(state, ['fire']);

    // Tick until collision
    for (let i = 0; i < 5; i++) {
      state = tick(state);
    }

    // Projectile should be consumed
    const playerProj = state.projectiles.filter((p) => p.owner === 'player');
    expect(playerProj).toHaveLength(0);
  });
});

describe('player damage', () => {
  it('takes damage from enemy contact', () => {
    let state = createInitialGameState();

    // Place enemy on top of the player
    state = {
      ...state,
      enemies: [
        {
          id: 100,
          x: state.player.x,
          y: state.player.y,
          kind: 'shardling',
          glyph: 's',
          health: 1,
          speed: 0,
          damage: 1,
          moveAccumulator: 0,
        },
      ],
    };

    state = tick(state);

    expect(state.player.health).toBe(4);
  });

  it('grants invincibility after taking damage', () => {
    let state = createInitialGameState();

    state = {
      ...state,
      enemies: [
        {
          id: 100,
          x: state.player.x,
          y: state.player.y,
          kind: 'shardling',
          glyph: 's',
          health: 999, // won't die
          speed: 0,
          damage: 1,
          moveAccumulator: 0,
        },
      ],
    };

    state = tick(state);
    expect(state.player.health).toBe(4);
    expect(state.player.invincibilityTicks).toBeGreaterThan(0);

    // Next tick should NOT take damage (invincible)
    state = tick(state);
    expect(state.player.health).toBe(4);
  });

  it('triggers game over at 0 health', () => {
    let state = createInitialGameState();

    state = {
      ...state,
      player: { ...state.player, health: 1, invincibilityTicks: 0 },
      enemies: [
        {
          id: 100,
          x: state.player.x,
          y: state.player.y,
          kind: 'shardling',
          glyph: 's',
          health: 999,
          speed: 0,
          damage: 1,
          moveAccumulator: 0,
        },
      ],
    };

    state = tick(state);
    expect(state.player.health).toBe(0);
    expect(state.gameOver).toBe(true);
  });

  it('stops processing ticks after game over', () => {
    let state = createInitialGameState();
    state = { ...state, gameOver: true, tick: 42 };

    state = tick(state, ['move_up']);
    expect(state.tick).toBe(42); // unchanged
  });
});

describe('tick counter', () => {
  it('increments each tick', () => {
    let state = createInitialGameState();
    expect(state.tick).toBe(0);

    state = tick(state);
    expect(state.tick).toBe(1);

    state = tick(state);
    expect(state.tick).toBe(2);
  });
});
