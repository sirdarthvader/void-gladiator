import type { GameplayState } from '../types/gameplay-state.js';
import type { Projectile } from '../types/entities.js';
import { PLAYER_INVINCIBILITY_TICKS } from '@void-gladiator/content';

/**
 * Detect collisions between player projectiles and enemies.
 * Awards score and increments kills on the shooting player.
 */
export const resolveProjectileEnemyCollisions = (
  state: GameplayState
): GameplayState => {
  const survivingProjectiles: Projectile[] = [];
  let enemies = state.enemies.map((e) => ({ ...e }));
  let players = state.players.map((p) => ({ ...p }));

  for (const proj of state.projectiles) {
    // Only player-owned projectiles hit enemies
    if (proj.ownerId < 0) {
      survivingProjectiles.push(proj);
      continue;
    }

    let hit = false;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (Math.abs(proj.x - e.x) < 1 && Math.abs(proj.y - e.y) < 1) {
        enemies[i] = { ...e, health: e.health - 1 };
        hit = true;

        // Award score to the shooter if enemy dies
        if (enemies[i].health <= 0) {
          const shooterIdx = players.findIndex((p) => p.id === proj.ownerId);
          if (shooterIdx !== -1) {
            players[shooterIdx] = {
              ...players[shooterIdx],
              score: players[shooterIdx].score + 10,
              kills: players[shooterIdx].kills + 1,
              streak: players[shooterIdx].streak + 1,
              streakTimer: 60, // reset streak decay timer
            };
          }
        }
        break;
      }
    }

    if (!hit) {
      survivingProjectiles.push(proj);
    }
  }

  const aliveEnemies = enemies.filter((e) => e.health > 0);

  return { ...state, projectiles: survivingProjectiles, enemies: aliveEnemies, players };
};

/**
 * Detect collisions between projectiles and players (PvP friendly fire).
 */
export const resolveProjectilePlayerCollisions = (
  state: GameplayState,
  friendlyFire: boolean
): GameplayState => {
  if (!friendlyFire) return state;

  const survivingProjectiles: Projectile[] = [];
  let players = state.players.map((p) => ({ ...p }));

  for (const proj of state.projectiles) {
    if (proj.ownerId < 0) {
      survivingProjectiles.push(proj);
      continue;
    }

    let hit = false;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      // Can't hit yourself, must be alive, must not be invincible
      if (
        p.id === proj.ownerId ||
        p.status !== 'alive' ||
        p.invincibilityTicks > 0
      ) {
        continue;
      }

      if (Math.abs(proj.x - p.x) < 1 && Math.abs(proj.y - p.y) < 1) {
        const newHealth = Math.max(0, p.health - 1);
        players[i] = {
          ...p,
          health: newHealth,
          invincibilityTicks: PLAYER_INVINCIBILITY_TICKS,
          status: newHealth <= 0 ? 'dead' : 'alive',
          streak: 0, // taking damage resets streak
        };

        // Award kill to shooter if target dies
        if (newHealth <= 0) {
          const shooterIdx = players.findIndex((pl) => pl.id === proj.ownerId);
          if (shooterIdx !== -1) {
            players[shooterIdx] = {
              ...players[shooterIdx],
              kills: players[shooterIdx].kills + 1,
              score: players[shooterIdx].score + 50,
              streak: players[shooterIdx].streak + 1,
              streakTimer: 60,
            };
          }
          players[i] = {
            ...players[i],
            deaths: players[i].deaths + 1,
          };
        }

        hit = true;
        break;
      }
    }

    if (!hit) {
      survivingProjectiles.push(proj);
    }
  }

  return { ...state, projectiles: survivingProjectiles, players };
};

/**
 * Handle enemy-to-player contact damage.
 */
export const resolveEnemyContact = (state: GameplayState): GameplayState => {
  let players = state.players.map((p) => ({ ...p }));
  let changed = false;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (player.status !== 'alive' || player.invincibilityTicks > 0) continue;

    let damage = 0;
    for (const enemy of state.enemies) {
      if (
        Math.abs(enemy.x - player.x) < 1 &&
        Math.abs(enemy.y - player.y) < 1
      ) {
        damage += enemy.damage;
      }
    }

    if (damage > 0) {
      const newHealth = Math.max(0, player.health - damage);
      players[i] = {
        ...player,
        health: newHealth,
        invincibilityTicks: PLAYER_INVINCIBILITY_TICKS,
        status: newHealth <= 0 ? 'dead' : 'alive',
        streak: 0,
        deaths: newHealth <= 0 ? player.deaths + 1 : player.deaths,
      };
      changed = true;
    }
  }

  return changed ? { ...state, players } : state;
};
