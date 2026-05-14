import type { GameCommand, Command } from '@void-gladiator/protocol';

const commandLabels: Record<GameCommand, string> = {
  move_up: 'W',
  move_down: 'S',
  move_left: 'A',
  move_right: 'D',
  fire: 'Space',
  dash: 'K',
  special: 'J',
  quit: 'Q',
};

const keyToGameCommand: Record<string, GameCommand | undefined> = {
  '\u0003': 'quit',
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

export interface CreateTerminalInputOptions {
  onCommand: (command: GameCommand) => void;
  stream?: NodeJS.ReadStream;
}

export const createTerminalInput = ({
  onCommand,
  stream = process.stdin,
}: CreateTerminalInputOptions): TerminalInputController => {
  const handleData = (chunk: Buffer | string): void => {
    const input = typeof chunk === 'string' ? chunk : chunk.toString('utf8');

    for (const character of input) {
      const command = keyToGameCommand[character];

      if (command) {
        onCommand(command);
      }
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

/**
 * Scene-aware input controller.
 * Maps keys differently based on the current scene context.
 */
export type SceneContext = 'title' | 'lobby' | 'gameplay' | 'results';

export interface SceneInputOptions {
  onCommand: (command: Command) => void;
  getScene: () => SceneContext;
  stream?: NodeJS.ReadStream;
}

// Arrow key escape sequences
const ARROW_UP = '\x1b[A';
const ARROW_DOWN = '\x1b[B';
const ARROW_RIGHT = '\x1b[C';
const ARROW_LEFT = '\x1b[D';

export const createSceneInput = ({
  onCommand,
  getScene,
  stream = process.stdin,
}: SceneInputOptions): TerminalInputController => {
  let escBuffer = '';

  const handleData = (chunk: Buffer | string): void => {
    const input = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const scene = getScene();

    // Handle escape sequences (arrow keys)
    const fullInput = escBuffer + input;
    escBuffer = '';

    for (let i = 0; i < fullInput.length; i++) {
      const char = fullInput[i];

      // Check for escape sequence start
      if (char === '\x1b') {
        const remaining = fullInput.slice(i);
        if (remaining.startsWith(ARROW_LEFT)) {
          emitForScene(scene, 'arrow_left', onCommand);
          i += 2; // skip [D
          continue;
        } else if (remaining.startsWith(ARROW_RIGHT)) {
          emitForScene(scene, 'arrow_right', onCommand);
          i += 2;
          continue;
        } else if (remaining.startsWith(ARROW_UP)) {
          emitForScene(scene, 'arrow_up', onCommand);
          i += 2;
          continue;
        } else if (remaining.startsWith(ARROW_DOWN)) {
          emitForScene(scene, 'arrow_down', onCommand);
          i += 2;
          continue;
        } else if (remaining.length < 3) {
          // Incomplete escape sequence, buffer for next chunk
          escBuffer = remaining;
          break;
        }
        // Unknown escape sequence, skip
        continue;
      }

      // Regular character handling
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
  switch (scene) {
    case 'lobby':
      if (arrow === 'arrow_left') emit('select_mode_prev');
      if (arrow === 'arrow_right') emit('select_mode_next');
      break;
    case 'gameplay':
      // Arrows not used in gameplay (WASD only)
      break;
  }
};

const emitCharForScene = (
  scene: SceneContext,
  char: string,
  emit: (cmd: Command) => void
): void => {
  // Quit is universal
  if (char === '\u0003' || char === 'q' || char === 'Q') {
    emit('quit');
    return;
  }

  switch (scene) {
    case 'title':
      // Any key transitions
      if (char === ' ' || char === '\r') emit('confirm');
      break;

    case 'lobby':
      if (char === ' ') emit('toggle_ready');
      if (char === '\r') emit('start_game');
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

export const describeLocalControls = (): string => {
  return Object.entries(commandLabels)
    .map(([command, key]) => `${key}:${command}`)
    .join(' ');
};
export type InputState = {
  firePressed: boolean;
  moveX: -1 | 0 | 1;
  moveY: -1 | 0 | 1;
  specialPressed: boolean;
};

export const createIdleInputState = (): InputState => {
  return {
    firePressed: false,
    moveX: 0,
    moveY: 0,
    specialPressed: false,
  };
};
