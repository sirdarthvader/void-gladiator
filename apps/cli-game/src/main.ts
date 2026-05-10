import { createTicker } from '@void-gladiator/engine-loop';
import {
  createInitialGameState,
  tickGameState,
} from '@void-gladiator/game-core';
import type { GameState } from '@void-gladiator/game-core';
import { renderArenaFrame } from '@void-gladiator/renderer-ansi';
import {
  createTerminalInput,
  describeLocalControls,
} from '@void-gladiator/terminal-input';
import type { GameCommand } from '@void-gladiator/protocol';

let state: GameState = createInitialGameState();
let pendingCommands: GameCommand[] = [];
const _controls = describeLocalControls();

const renderFrame = (): void => {
  process.stdout.write('\x1b[2J\x1b[H');
  process.stdout.write(renderArenaFrame(state));
  process.stdout.write('\n');
};

const shutdown = (): never => {
  terminalInput.detach();
  ticker.stop();
  process.stdout.write('\x1b[?25h');
  process.stdout.write('\nExiting Void Gladiator.\n');
  process.exit(0);
};

const ticker = createTicker({
  fps: 30,
  tick: () => {
    state = tickGameState(state, { commands: pendingCommands });
    pendingCommands = [];
    renderFrame();

    if (state.gameOver) {
      // Let the player see the death screen briefly before exiting
      setTimeout(() => {
        shutdown();
      }, 2000);
      ticker.stop();
    }
  },
});

const terminalInput = createTerminalInput({
  onCommand: (command) => {
    if (command === 'quit') {
      shutdown();
      return;
    }

    pendingCommands.push(command);
  },
});

if (process.env.VOID_GLADIATOR_ONCE === '1') {
  renderFrame();
} else {
  process.stdout.write('\x1b[?25h');
  process.stdout.write('\x1b[?25l');
  terminalInput.attach();
  ticker.start();
  process.on('SIGINT', shutdown);
}
