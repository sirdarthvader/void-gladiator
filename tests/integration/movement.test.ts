import { describe, expect, it } from 'vitest';

import { applyCommands, createInitialGameState } from '../../packages/game-core/src/index.js';

describe('game-core movement', () => {
  it('moves the player inside the arena bounds', () => {
    const initialState = createInitialGameState();

    const nextState = applyCommands(initialState, ['move_left', 'move_up']);

    expect(nextState.player.x).toBe(initialState.player.x - 1);
    expect(nextState.player.y).toBe(initialState.player.y - 1);
  });

  it('clamps the player at the arena edge', () => {
    const initialState = createInitialGameState();
    const commands = Array.from({ length: 200 }, () => 'move_left' as const);

    const nextState = applyCommands(initialState, commands);

    expect(nextState.player.x).toBe(0);
  });
});