# @void-gladiator/content

## 0.2.0

### Minor Changes

- [`cbc17af`](https://github.com/sirdarthvader/void-gladiator/commit/cbc17af8900c49f2683a8bf8eff32dc028b4bf6f) Thanks [@sirdarthvader](https://github.com/sirdarthvader)! - Version bump for enhacned renderer

## 0.1.1

### Patch Changes

- [`013de21`](https://github.com/sirdarthvader/void-gladiator/commit/013de218e1bb3f5349203033d8813b87c041828d) Thanks [@sirdarthvader](https://github.com/sirdarthvader)! - Add codeowners

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
