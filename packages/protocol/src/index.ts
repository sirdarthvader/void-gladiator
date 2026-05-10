export type GameCommand =
  | 'move_up'
  | 'move_down'
  | 'move_left'
  | 'move_right'
  | 'fire'
  | 'dash'
  | 'special'
  | 'quit';

export interface CommandBatch {
  tick: number;
  commands: GameCommand[];
}
export type CommandEnvelope = {
  kind: 'input';
  tick: number;
};
