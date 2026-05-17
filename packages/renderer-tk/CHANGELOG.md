# @void-gladiator/renderer-tk

## 1.1.0

### Minor Changes

- [#7](https://github.com/sirdarthvader/void-gladiator/pull/7) [`70b2677`](https://github.com/sirdarthvader/void-gladiator/commit/70b267710ca81ae9fb09f8ddaee66d25def18e31) Thanks [@sirdarthvader](https://github.com/sirdarthvader)! - ### Enhanced renderer — Phases 2–4 + HUD fix

  **Phase 2: Particle & Effect System**
  - Render-only `RenderState` (particles, hit markers, screen shake, flash) — fully separate from `GameState`, simulation stays deterministic
  - Particle engine: explosions (enemy death), death bursts (player death), hit sparks (damage), projectile trails (40% per-frame emit)
  - Screen shake with intensity stacking and decay, flash overlay, floating hit markers
  - Event detection via diffing consecutive `GameplayState` snapshots

  **Phase 3: Ambience & Transitions**
  - Ambient drift particles (spawn at edges, float across arena) and starfield system (twinkling stars with brightness cycling)
  - Scene transitions: `fade_in` (dissolving dark overlay) for menus, `wipe_down` (row-by-row reveal) for gameplay
  - Title scene: starfield background, color-cycling title glow (256-color wave), pulsing prompt

  **Phase 4: Polish & Content**
  - Extended sprite library: voidcrawler (2×1), wraith (1×2), sentinel (2×2), spitter. Pickup sprites and special projectile glyphs
  - 256-color palette system: gradients for health, energy, fire, void, streak. Per-player 4-color palettes
  - Visual config via env vars: `VOID_PARTICLES` (0/1/2), `VOID_COLORS` (16/256/truecolor), `VOID_REDUCED_MOTION=1`

  **Bug fix: HUD invisible in enhanced renderer**
  - Root cause: `ScreenBuffer` constructor used `x: 0, y: 0`, overriding terminal-kit's default `(1, 1)` for Terminal destinations. The draw pipeline clipped buffer row 0 (HUD) and column 0 (left border) due to 0-based vs 1-based coordinate mismatch
  - HUD now renders after all arena content so screen shake cannot overwrite it
  - Particles and hit markers clipped to arena bounds

## 1.0.0

### Major Changes

- [`cbc17af`](https://github.com/sirdarthvader/void-gladiator/commit/cbc17af8900c49f2683a8bf8eff32dc028b4bf6f) Thanks [@sirdarthvader](https://github.com/sirdarthvader)! - - New package @void-gladiator/renderer-tk using terminal-kit's ScreenBuffer for cell-level delta rendering with rich visual support
  - Renderer interface (init/render/cleanup) shared by both renderers
  - ScreenBuffer core with arena coordinate mapping and bounds clipping
  - Sprite system: 3x3 player sprites, 1x1 enemies/projectiles
  - All 4 scene renderers (title, lobby, gameplay, results)
  - Arena floor with subtle grid dots for depth
  - Pulsing title prompt animation
  - Switch via --renderer=enhanced or VOID_RENDERER=enhanced env var
  - Classic renderer (renderer-ansi) remains the default

### Patch Changes

- Updated dependencies [[`cbc17af`](https://github.com/sirdarthvader/void-gladiator/commit/cbc17af8900c49f2683a8bf8eff32dc028b4bf6f)]:
  - @void-gladiator/content@0.2.0
  - @void-gladiator/game-core@0.1.0
