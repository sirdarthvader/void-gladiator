import type { GameplayState } from '../types/gameplay-state.js';

/**
 * Tick down cooldowns, invincibility, respawn timers, and streak decay.
 */
export const tickCooldowns = (state: GameplayState): GameplayState => {
  const players = state.players.map((player) => {
    const updatedPlayer = {
      ...player,
      fireCooldown: Math.max(0, player.fireCooldown - 1),
      invincibilityTicks: Math.max(0, player.invincibilityTicks - 1),
    };

    // Streak decay
    if (updatedPlayer.streakTimer > 0) {
      updatedPlayer.streakTimer -= 1;
      if (updatedPlayer.streakTimer <= 0) {
        updatedPlayer.streak = 0;
      }
    }

    // Respawn countdown
    if (updatedPlayer.status === 'dead' && updatedPlayer.respawnTimer > 0) {
      updatedPlayer.respawnTimer -= 1;
    }

    return updatedPlayer;
  });

  return { ...state, players };
};
