import { createTicker } from '@void-gladiator/engine-loop';
import { createTitleState, tickApp } from '@void-gladiator/game-core';
import type { AppState } from '@void-gladiator/game-core';
import { renderFrame, resetFrameBuffer } from '@void-gladiator/renderer-ansi';
import { createSceneInput } from '@void-gladiator/terminal-input';
import type { SceneContext } from '@void-gladiator/terminal-input';
import type { Command } from '@void-gladiator/protocol';
import ansiEscapes from 'ansi-escapes';

let state: AppState = createTitleState();
let pendingCommands: Command[] = [];
let prevScene: string = state.scene;

const getScene = (): SceneContext => state.scene;

const render = (): void => {
  // On scene change, reset delta buffer so the full frame is redrawn.
  if (state.scene !== prevScene) {
    resetFrameBuffer();
    prevScene = state.scene;
  }

  // renderFrame() positions each row absolutely (CUP) and includes a
  // trailing \x1b[J to clear below FRAME_HEIGHT. A single write keeps
  // the frame atomic — no partial-frame flashes.
  process.stdout.write(renderFrame(state));
};

const shutdown = (): never => {
  terminalInput.detach();
  ticker.stop();
  // Restore: show cursor, leave alt screen
  process.stdout.write(ansiEscapes.cursorShow);
  process.stdout.write(ansiEscapes.exitAlternativeScreen);
  process.stdout.write('Exiting Void Gladiator.\n');
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
  // Enter alternate screen buffer (blank canvas, restores terminal on exit).
  // \x1b[2J explicitly clears it — some terminals (incl. VS Code's xterm.js)
  // don't blank the alt buffer on entry, so leftover glyphs can bleed through
  // the first frame.
  process.stdout.write(
    ansiEscapes.enterAlternativeScreen +
      ansiEscapes.eraseScreen +
      ansiEscapes.cursorTo(0, 0)
  );
  process.stdout.write(ansiEscapes.cursorHide);
  terminalInput.attach();
  ticker.start();
  process.on('SIGINT', shutdown);
}
