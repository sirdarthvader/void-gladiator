import type { GameCommand, Command } from '@void-gladiator/protocol';

const keyToGameCommand: Record<string, GameCommand | undefined> = {
  '': 'quit',
  q: 'quit',
  Q: 'quit',
  w: 'move_up',
  W: 'move_up',
  s: 'move_down',
  S: 'move_down',
  a: 'move_left',
  A: 'move_left',
  d: 'move_right',
  D: 'move_right',
  ' ': 'fire',
  j: 'special',
  J: 'special',
  k: 'dash',
  K: 'dash',
};

export interface TerminalInputController {
  attach: () => void;
  detach: () => void;
}

/**
 * Scene-aware input controller.
 * Maps keys differently based on the current scene context.
 */
export type SceneContext = 'title' | 'lobby' | 'gameplay' | 'results' | 'matchmaking';

export interface SceneInputOptions {
  onCommand: (command: Command) => void;
  /** Called with a single printable character while chat-input mode is active. */
  onChatChar?: (char: string) => void;
  /** True when the matchmaking scene is in chat-input mode (routes raw chars). */
  getChatActive?: () => boolean;
  getScene: () => SceneContext;
  stream?: NodeJS.ReadStream;
}

const ARROW_UP = '\x1b[A';
const ARROW_DOWN = '\x1b[B';
const ARROW_RIGHT = '\x1b[C';
const ARROW_LEFT = '\x1b[D';

// puts stdin in raw mode and listens for key presses, mapping them to game commands based on the current scene context.
// It handles both single-character inputs and multi-character escape sequences (like arrow keys), emitting commands through the provided callback.
// The controller can be attached and detached to manage event listeners and terminal modes cleanly.
export const createSceneInput = ({
  onCommand,
  onChatChar,
  getChatActive,
  getScene,
  stream = process.stdin,
}: SceneInputOptions): TerminalInputController => {
  let escBuffer = '';

  const handleData = (chunk: Buffer | string): void => {
    const input = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const scene = getScene();
    const chatActive = getChatActive?.() ?? false;

    const fullInput = escBuffer + input;
    escBuffer = '';

    for (let i = 0; i < fullInput.length; i++) {
      const char = fullInput[i];

      if (char === '\x1b') {
        const remaining = fullInput.slice(i);
        if (remaining.startsWith(ARROW_LEFT)) {
          if (!chatActive) emitForScene(scene, 'arrow_left', onCommand);
          i += 2;
          continue;
        } else if (remaining.startsWith(ARROW_RIGHT)) {
          if (!chatActive) emitForScene(scene, 'arrow_right', onCommand);
          i += 2;
          continue;
        } else if (remaining.startsWith(ARROW_UP)) {
          if (!chatActive) emitForScene(scene, 'arrow_up', onCommand);
          i += 2;
          continue;
        } else if (remaining.startsWith(ARROW_DOWN)) {
          if (!chatActive) emitForScene(scene, 'arrow_down', onCommand);
          i += 2;
          continue;
        } else if (remaining === '\x1b') {
          // Standalone Esc — fire cancel immediately, don't buffer.
          if (chatActive) {
            onCommand('cancel_chat');
          }
          break;
        } else if (remaining.length === 2 && remaining[1] === '[') {
          // `\x1b[` split across chunks — buffer and wait for the final byte.
          escBuffer = remaining;
          break;
        }
        // Any other unrecognised escape — discard.
        continue;
      }

      // Chat-capture mode: route printable chars + Enter + backspace
      if (chatActive && scene === 'matchmaking') {
        if (char === '\r' || char === '\n') {
          onCommand('submit_chat');
        } else if (char === '') {
          // Ctrl-C still quits
          onCommand('quit');
        } else if (char === '' || char === '\b') {
          // Backspace — signal via onChatChar with special token
          onChatChar?.('');
        } else if (char >= ' ') {
          onChatChar?.(char);
        }
        continue;
      }

      emitCharForScene(scene, char, onCommand);
    }
  };

  return {
    attach: () => {
      if (stream.isTTY) {
        stream.setRawMode(true);
      }
      stream.setEncoding('utf8');
      stream.resume();
      stream.on('data', handleData);
    },
    detach: () => {
      stream.off('data', handleData);
      if (stream.isTTY) {
        stream.setRawMode(false);
      }
      stream.pause();
    },
  };
};

type ArrowKey = 'arrow_up' | 'arrow_down' | 'arrow_left' | 'arrow_right';

const emitForScene = (
  scene: SceneContext,
  arrow: ArrowKey,
  emit: (cmd: Command) => void
): void => {
  if (scene === 'lobby') {
    if (arrow === 'arrow_left') emit('select_mode_prev');
    if (arrow === 'arrow_right') emit('select_mode_next');
  }
  if (scene === 'matchmaking') {
    if (arrow === 'arrow_left') emit('select_mode_prev');
    if (arrow === 'arrow_right') emit('select_mode_next');
  }
};

const emitCharForScene = (
  scene: SceneContext,
  char: string,
  emit: (cmd: Command) => void
): void => {
  // Quit is universal.
  if (char === '' || char === 'q' || char === 'Q') {
    emit('quit');
    return;
  }

  switch (scene) {
    case 'title':
      if (char === ' ' || char === '\r') emit('confirm');
      break;

    case 'lobby':
      if (char === ' ') emit('toggle_ready');
      if (char === '\r') emit('start_game');
      if (char === 'a' || char === 'A') emit('select_mode_prev');
      if (char === 'd' || char === 'D') emit('select_mode_next');
      break;

    case 'matchmaking':
      if (char === 't' || char === 'T') emit('enter_chat');
      if (char === ' ' || char === '\r') emit('start_session');
      if (char === 'a' || char === 'A') emit('select_mode_prev');
      if (char === 'd' || char === 'D') emit('select_mode_next');
      break;

    case 'gameplay': {
      const cmd = keyToGameCommand[char];
      if (cmd) emit(cmd);
      break;
    }

    case 'results':
      if (char === 'r' || char === 'R') emit('rematch');
      break;
  }
};
