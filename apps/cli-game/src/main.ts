import { createTicker } from '@void-gladiator/engine-loop';
import { createTitleState, tickApp } from '@void-gladiator/game-core';
import type { AppState } from '@void-gladiator/game-core';
import { renderFrame, resetFrameBuffer } from '@void-gladiator/renderer-ansi';
import {
  createEnhancedRenderer,
  type Renderer,
} from '@void-gladiator/renderer-tk';
import { createSceneInput } from '@void-gladiator/terminal-input';
import type { SceneContext } from '@void-gladiator/terminal-input';
import type { Command } from '@void-gladiator/protocol';
import {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  ARENA_MARGIN_X,
  ARENA_MARGIN_Y,
  isTerminalTooSmall,
} from '@void-gladiator/content';
import ansiEscapes from 'ansi-escapes';

// ── Terminal size check ──────────────────────────────────────────────
// The simulation arena is a fixed size so all players share the same
// game world in multiplayer. The terminal just needs to be big enough
// to display it.

const cols = process.stdout.columns ?? 80;
const rows = process.stdout.rows ?? 24;

if (isTerminalTooSmall(cols, rows)) {
  const minCols = ARENA_WIDTH + ARENA_MARGIN_X;
  const minRows = ARENA_HEIGHT + ARENA_MARGIN_Y;
  process.stderr.write(
    `\nTerminal too small (${cols}×${rows}).\n` +
      `Void Gladiator needs at least ${minCols}×${minRows}.\n` +
      `Please resize your terminal and try again.\n\n`
  );
  process.exit(1);
}

// ── Renderer selection ───────────────────────────────────────────────
// Use --renderer=enhanced or VOID_RENDERER=enhanced to switch renderers.
// Default: classic (string-based renderer-ansi).

const rendererArg = process.argv.find((a) => a.startsWith('--renderer='));
const rendererChoice =
  rendererArg?.split('=')[1] ??
  process.env['VOID_RENDERER'] ??
  'classic';

const createClassicRenderer = (): Renderer => {
  let prevScene = '';
  return {
    init() {
      process.stdout.write(
        ansiEscapes.enterAlternativeScreen +
          ansiEscapes.eraseScreen +
          ansiEscapes.cursorTo(0, 0) +
          ansiEscapes.cursorHide
      );
    },
    render(state: AppState) {
      if (state.scene !== prevScene) {
        resetFrameBuffer();
        prevScene = state.scene;
      }
      process.stdout.write(renderFrame(state));
    },
    cleanup() {
      process.stdout.write(
        ansiEscapes.cursorShow + ansiEscapes.exitAlternativeScreen
      );
    },
  };
};

const renderer: Renderer =
  rendererChoice === 'enhanced'
    ? createEnhancedRenderer()
    : createClassicRenderer();

// ── Game state ───────────────────────────────────────────────────────

let state: AppState = createTitleState(ARENA_WIDTH, ARENA_HEIGHT);
let pendingCommands: Command[] = [];

const getScene = (): SceneContext => state.scene;

const render = (): void => {
  renderer.render(state);
};

const shutdown = (): never => {
  terminalInput.detach();
  ticker.stop();
  renderer.cleanup();
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
  renderer.init();
  terminalInput.attach();
  ticker.start();
  process.on('SIGINT', shutdown);
}
