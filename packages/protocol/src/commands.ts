/**
 * Game action commands — inputs a player can perform during gameplay.
 */
export type GameCommand =
  | 'move_up'
  | 'move_down'
  | 'move_left'
  | 'move_right'
  | 'fire'
  | 'dash'
  | 'special'
  | 'quit';

/**
 * Scene-level commands — control scene transitions and lobby interactions.
 */
export type SceneCommand =
  | 'start_game'
  | 'toggle_ready'
  | 'select_mode_next'
  | 'select_mode_prev'
  | 'rematch'
  | 'return_to_lobby'
  | 'confirm';

/**
 * The full set of commands the system can process.
 */
export type Command = GameCommand | SceneCommand;
