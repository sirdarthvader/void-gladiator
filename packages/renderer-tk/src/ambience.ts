/**
 * Background ambience — drifting void particles and subtle floor noise.
 *
 * These are purely cosmetic background effects rendered beneath game entities.
 * They give the arena a living, breathing feel without affecting gameplay.
 */

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: number; // 256-color index
  life: number;
  maxLife: number;
}

export interface AmbienceState {
  particles: AmbientParticle[];
  tick: number;
}

// ── Config ───────────────────────────────────────────────────────────

const MAX_AMBIENT_PARTICLES = 30;
const SPAWN_CHANCE = 0.15; // chance per tick to spawn a new particle
const DRIFT_CHARS = ['.', '`', "'", ',', '~'];
const VOID_COLORS = [233, 234, 235, 236, 237]; // very dark grays

const randomPick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const randomRange = (min: number, max: number): number =>
  min + Math.random() * (max - min);

// ── Create ───────────────────────────────────────────────────────────

export const createAmbienceState = (): AmbienceState => ({
  particles: [],
  tick: 0,
});

// ── Update ───────────────────────────────────────────────────────────

/**
 * Advance ambience by one frame. Spawns, moves, and culls drift particles.
 */
export const tickAmbience = (
  state: AmbienceState,
  arenaWidth: number,
  arenaHeight: number
): AmbienceState => {
  let { particles } = state;
  const tick = state.tick + 1;

  // Spawn new particles at random edges
  if (
    particles.length < MAX_AMBIENT_PARTICLES &&
    Math.random() < SPAWN_CHANCE
  ) {
    const edge = Math.floor(Math.random() * 4);
    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    switch (edge) {
      case 0: // top
        x = randomRange(0, arenaWidth);
        y = 0;
        vx = randomRange(-0.1, 0.1);
        vy = randomRange(0.05, 0.15);
        break;
      case 1: // bottom
        x = randomRange(0, arenaWidth);
        y = arenaHeight - 1;
        vx = randomRange(-0.1, 0.1);
        vy = randomRange(-0.15, -0.05);
        break;
      case 2: // left
        x = 0;
        y = randomRange(0, arenaHeight);
        vx = randomRange(0.05, 0.15);
        vy = randomRange(-0.1, 0.1);
        break;
      default: // right
        x = arenaWidth - 1;
        y = randomRange(0, arenaHeight);
        vx = randomRange(-0.15, -0.05);
        vy = randomRange(-0.1, 0.1);
        break;
    }

    const life = 30 + Math.floor(Math.random() * 60);

    particles = [
      ...particles,
      {
        x,
        y,
        vx,
        vy,
        char: randomPick(DRIFT_CHARS),
        color: randomPick(VOID_COLORS),
        life,
        maxLife: life,
      },
    ];
  }

  // Update existing particles
  const alive: AmbientParticle[] = [];
  for (const p of particles) {
    const nx = p.x + p.vx;
    const ny = p.y + p.vy;
    const nl = p.life - 1;

    if (nl > 0 && nx >= 0 && nx < arenaWidth && ny >= 0 && ny < arenaHeight) {
      alive.push({ ...p, x: nx, y: ny, life: nl });
    }
  }

  return { particles: alive, tick };
};

// ── Starfield for title screen ───────────────────────────────────────

export interface Star {
  x: number;
  y: number;
  brightness: number; // 0-2: dim, normal, bright
  twinkleRate: number; // ticks between twinkle state changes
}

export interface StarfieldState {
  stars: Star[];
}

/**
 * Create a starfield background filling the given dimensions.
 */
export const createStarfield = (
  width: number,
  height: number,
  density: number = 0.02
): StarfieldState => {
  const stars: Star[] = [];
  const count = Math.floor(width * height * density);

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
      brightness: Math.floor(Math.random() * 3),
      twinkleRate: 15 + Math.floor(Math.random() * 45),
    });
  }

  return { stars };
};

const STAR_CHARS = ['.', '+', '*'];
const STAR_COLORS = [236, 240, 245]; // dim → bright grays

/**
 * Get a star's current visual state based on tick.
 */
export const getStarVisual = (
  star: Star,
  tick: number
): { char: string; color: number } => {
  const phase = Math.floor(tick / star.twinkleRate) % 3;
  const b = (star.brightness + phase) % 3;
  return {
    char: STAR_CHARS[b],
    color: STAR_COLORS[b],
  };
};
