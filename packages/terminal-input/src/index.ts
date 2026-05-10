import type { GameCommand } from '@void-gladiator/protocol';

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

const keyToCommand: Record<string, GameCommand | undefined> = {
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
      const command = keyToCommand[character];

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
