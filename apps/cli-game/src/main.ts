import { createTicker } from '@void-gladiator/engine-loop';
import { createTitleState, tickApp } from '@void-gladiator/game-core';
import type { AppState } from '@void-gladiator/game-core';
import { renderFrame } from '@void-gladiator/renderer-ansi';
import { createSceneInput } from '@void-gladiator/terminal-input';
import type { SceneContext } from '@void-gladiator/terminal-input';
import type { Command } from '@void-gladiator/protocol';

let state: AppState = createTitleState();
let pendingCommands: Command[] = [];

const getScene = (): SceneContext => state.scene;

const render = (): void => {
  process.stdout.write('\x1b[2J\x1b[H');
  process.stdout.write(renderFrame(state));
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
    // Build per-player command map (single-player: all commands go to player 0)
    const commandsByPlayer = new Map<number, readonly Command[]>();
    if (pendingCommands.length > 0) {
      commandsByPlayer.set(0, [...pendingCommands]);
    }
    pendingCommands = [];

    // Advance state
    state = tickApp(state, { commandsByPlayer });

    // Render
    render();
  },
});

const terminalInput = createSceneInput({
  onCommand: (command) => {
    if (command === 'quit') {
      shutdown();
      return;
    }
    pendingCommands.push(command);
  },
  getScene,
});

if (process.env.VOID_GLADIATOR_ONCE === '1') {
  render();
} else {
  process.stdout.write('\x1b[?25h');
  process.stdout.write('\x1b[?25l');
  terminalInput.attach();
  ticker.start();
  process.on('SIGINT', shutdown);
}
