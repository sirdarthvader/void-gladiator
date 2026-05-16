# @void-gladiator/renderer-tk

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
