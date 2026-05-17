/**
 * User-tunable visual settings for the enhanced renderer.
 *
 * These settings control visual density and color mode without
 * affecting gameplay. Read from environment variables at startup.
 */

export interface VisualConfig {
  /** Particle spawn density multiplier (0→none, 1→default, 2→double). */
  particleDensity: number;

  /** Color mode: 16 (basic ANSI), 256 (extended), or 'truecolor'. */
  colorMode: 16 | 256 | 'truecolor';

  /** Disable animated effects (particles, shake, flash, transitions). */
  reducedMotion: boolean;

  /** Show ambient drift particles in gameplay. */
  ambience: boolean;

  /** Show starfield on title screen. */
  starfield: boolean;

  /** Enable scene transition effects. */
  transitions: boolean;
}

const DEFAULT_CONFIG: VisualConfig = {
  particleDensity: 1,
  colorMode: 256,
  reducedMotion: false,
  ambience: true,
  starfield: true,
  transitions: true,
};

/**
 * Read visual config from environment variables.
 *
 * VOID_PARTICLES=0|1|2        — particle density (0=off, 1=normal, 2=double)
 * VOID_COLORS=16|256|truecolor — color mode
 * VOID_REDUCED_MOTION=1       — disable animations
 */
export const loadVisualConfig = (): VisualConfig => {
  const env = typeof process !== 'undefined' ? process.env : {};
  const config = { ...DEFAULT_CONFIG };

  // Particle density
  const pd = env['VOID_PARTICLES'];
  if (pd !== undefined) {
    const n = parseFloat(pd);
    if (!isNaN(n) && n >= 0 && n <= 2) {
      config.particleDensity = n;
    }
  }

  // Color mode
  const cm = env['VOID_COLORS'];
  if (cm === '16') config.colorMode = 16;
  else if (cm === '256') config.colorMode = 256;
  else if (cm === 'truecolor') config.colorMode = 'truecolor';

  // Reduced motion
  if (env['VOID_REDUCED_MOTION'] === '1') {
    config.reducedMotion = true;
    config.ambience = false;
    config.starfield = false;
    config.transitions = false;
    config.particleDensity = 0;
  }

  return config;
};
