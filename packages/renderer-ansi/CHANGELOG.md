# @void-gladiator/renderer-ansi

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

## 0.1.1

### Patch Changes

- [`013de21`](https://github.com/sirdarthvader/void-gladiator/commit/013de218e1bb3f5349203033d8813b87c041828d) Thanks [@sirdarthvader](https://github.com/sirdarthvader)! - Add codeowners

- Updated dependencies [[`013de21`](https://github.com/sirdarthvader/void-gladiator/commit/013de218e1bb3f5349203033d8813b87c041828d)]:
  - @void-gladiator/content@0.1.1
  - @void-gladiator/game-core@0.0.2

## 0.1.0

### Minor Changes

- [#1](https://github.com/sirdarthvader/void-gladiator/pull/1) [`f555777`](https://github.com/sirdarthvader/void-gladiator/commit/f555777b9ae0d7eddaefdc9df668c718c24b10b1) Thanks [@sirdarthvader](https://github.com/sirdarthvader)! - New rendering engine: chalk + ansi-escapes + delta rendering
  - Replace raw ANSI escape codes with chalk for colors/styles
  - Replace raw cursor/screen control with ansi-escapes
  - Add delta rendering to frame-buffer (only write changed lines per tick)
  - Decouple content from renderer (named color strings instead of ANSI codes)
  - Switch to ASCII borders for reliable cross-terminal rendering
  - Simplify title screen (spaced text, no animation)
  - Increase arena size to 72x30

### Patch Changes

- [#3](https://github.com/sirdarthvader/void-gladiator/pull/3) [`67570e6`](https://github.com/sirdarthvader/void-gladiator/commit/67570e6cb27dd1db39db4bcce44cd4e93cd8a879) Thanks [@sirdarthvader](https://github.com/sirdarthvader)! - Update for auto versioning

- Updated dependencies [[`f555777`](https://github.com/sirdarthvader/void-gladiator/commit/f555777b9ae0d7eddaefdc9df668c718c24b10b1), [`67570e6`](https://github.com/sirdarthvader/void-gladiator/commit/67570e6cb27dd1db39db4bcce44cd4e93cd8a879)]:
  - @void-gladiator/content@0.1.0
  - @void-gladiator/game-core@0.0.1
