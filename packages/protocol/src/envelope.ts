import type { Command } from './commands.js';

/**
 * A player-tagged command envelope.
 * Every command is scoped to a specific player — even in single-player (player 0).
 */
export interface CommandEnvelope {
  playerId: number;
  command: Command;
}

/**
 * A batch of commands from a single player for a given tick.
 */
export interface CommandBatch {
  playerId: number;
  tick: number;
  commands: Command[];
}

/**
 * Input for a single simulation tick — commands from all players.
 */
export interface TickInput {
  batches: CommandBatch[];
}
