import { homedir } from 'node:os';
import { join } from 'node:path';

export const getHighScorePath = (): string => {
  return join(homedir(), '.void-gladiator', 'high-score.json');
};
export type HighScoreSummary = {
  score: number;
  wave: number;
};

export const loadHighScoreSummary = (): HighScoreSummary => {
  return {
    score: 0,
    wave: 0,
  };
};
