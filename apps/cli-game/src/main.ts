import { createTitleState } from '@void-gladiator/game-core';
import { renderFrame, resetFrameBuffer } from '@void-gladiator/renderer-ansi';
import { createEnhancedRenderer, type Renderer } from '@void-gladiator/renderer-tk';
import {
  ARENA_WIDTH, ARENA_HEIGHT, ARENA_MARGIN_X, ARENA_MARGIN_Y, isTerminalTooSmall,
} from '@void-gladiator/content';
import type { AppState } from '@void-gladiator/game-core';
import ansiEscapes from 'ansi-escapes';
import { connectMultiplayer } from './multiplayer-adapter.js';
import type { MultiplayerSessionConfig } from './multiplayer-adapter.js';
import { createGameLoop } from './game-loop.js';

// ── Terminal size check ──────────────────────────────────────────────

const cols = process.stdout.columns ?? 80;
const rows = process.stdout.rows ?? 24;

if (isTerminalTooSmall(cols, rows)) {
  process.stderr.write(
    `\nTerminal too small (${cols}×${rows}).\n` +
    `Void Gladiator needs at least ${ARENA_WIDTH + ARENA_MARGIN_X}×${ARENA_HEIGHT + ARENA_MARGIN_Y}.\n` +
    `Please resize your terminal and try again.\n\n`,
  );
  process.exit(1);
}

// ── CLI args ─────────────────────────────────────────────────────────

const get = (flag: string): string | null => {
  const i = process.argv.indexOf(flag);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
};
const has = (flag: string): boolean => process.argv.includes(flag);

const role: 'host' | 'guest' | null = has('--host') ? 'host' : has('--join') ? 'guest' : null;
const session = {
  role,
  name: get('--name') ?? 'Player',
  room: get('--room') ?? 'void-arena',
  port: parseInt(get('--port') ?? '7777', 10),
  server: get('--server') ?? 'localhost:7777',
};

// ── Renderer ─────────────────────────────────────────────────────────

const rendererChoice =
  process.argv.find((a) => a.startsWith('--renderer='))?.split('=')[1] ??
  process.env['VOID_RENDERER'] ??
  'classic';

const createClassicRenderer = (): Renderer => {
  let prevScene = '';
  return {
    init() {
      process.stdout.write(
        ansiEscapes.enterAlternativeScreen + ansiEscapes.eraseScreen +
        ansiEscapes.cursorTo(0, 0) + ansiEscapes.cursorHide,
      );
    },
    render(state: AppState) {
      if (state.scene !== prevScene) { resetFrameBuffer(); prevScene = state.scene; }
      process.stdout.write(renderFrame(state));
    },
    cleanup() {
      process.stdout.write(ansiEscapes.cursorShow + ansiEscapes.exitAlternativeScreen);
    },
  };
};

const renderer = rendererChoice === 'enhanced' ? createEnhancedRenderer() : createClassicRenderer();

// ── Initial state ─────────────────────────────────────────────────────

const initialTitle = createTitleState(ARENA_WIDTH, ARENA_HEIGHT);
if (role !== null) {
  (initialTitle as typeof initialTitle & { multiplayer: unknown }).multiplayer = {
    role,
    myName: session.name,
    roomName: session.room,
    server: role === 'guest' ? session.server : undefined,
    port: role === 'host' ? session.port : undefined,
  };
}

// ── Boot ──────────────────────────────────────────────────────────────

let loop: ReturnType<typeof createGameLoop>;

const shutdown = (): never => {
  loop.stop();
  process.stdout.write('Exiting Void Gladiator.\n');
  process.exit(0);
};

const onConnect = role !== null
  ? () => connectMultiplayer(session as MultiplayerSessionConfig)
  : undefined;

loop = createGameLoop({ renderer, onShutdown: shutdown, onConnect });
loop.start(initialTitle);
