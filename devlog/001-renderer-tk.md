# 001 — Enhanced Terminal-Kit Renderer (`renderer-tk`)

**Status:** Phase 1 — Not started  
**Package:** `@void-gladiator/renderer-tk`

---

## Summary

Add a new renderer built on terminal-kit's ScreenBuffer — a cell-level framebuffer with native delta rendering, sprite composition via nested buffers, and transparency support. The existing `renderer-ansi` (string-building + chalk) remains as a `--renderer=classic` fallback. The app switches renderers via CLI flag or `VOID_RENDERER` env var.

All visual effects live in a render-only `RenderState` — the simulation (`GameState`) stays deterministic and unchanged.

---

## Architecture

### New dependency flow

```
cli-game → renderer-tk → game-core (types only), content, shared
cli-game → renderer-ansi (unchanged)
renderer-tk → terminal-kit (new dep)
```

### Renderer interface (shared by both)

```typescript
interface Renderer {
  init(): void;          // Enter alt screen, hide cursor, allocate buffers
  render(state: AppState): void;  // Draw current frame (delta)
  cleanup(): void;       // Restore terminal, show cursor, exit alt screen
}
```

The existing `renderer-ansi` gets a thin adapter wrapping its `renderFrame()` string output.

### Key concepts

- **ScreenBuffer**: terminal-kit's cell grid — each cell has char, fg, bg, style attributes. `buffer.draw({delta: true})` only flushes changed cells.
- **Sprites**: 2D arrays of `{ char, fg, bg, attr }` with transparency. Composed via nested ScreenBuffers.
- **RenderState**: Tracks particles, timers, screen effects. Separate from `GameState` to preserve simulation determinism. Updated each render tick.

---

## Phases

### Phase 1: Foundation + Gameplay Scene _(current)_

Core ScreenBuffer infrastructure, sprite system, gameplay scene with rich visuals, app wiring.

| Task | Description | Status |
|------|-------------|--------|
| 1a. Package scaffold | Create `packages/renderer-tk/` — package.json, project.json, tsconfig.json, src/index.ts. Install `terminal-kit`. | ⬜ |
| 1b. Renderer interface | Define `Renderer` interface. Adapt `renderer-ansi` with wrapper. | ⬜ |
| 1c. ScreenBuffer core | Init terminal-kit, create ScreenBuffer at frame dimensions, delta draw loop, cursor/alt-screen management. | ⬜ |
| 1d. Sprite system | `Sprite` type (2D cell array + transparency). Sprite defs for players (3×3), enemies, projectiles. | ⬜ |
| 1e. Gameplay scene | Arena borders, player sprites, enemy sprites, projectiles, HUD — all via ScreenBuffer. | ⬜ |
| 1f. App integration | `--renderer=enhanced\|classic` flag + `VOID_RENDERER` env var in `cli-game`. | ⬜ |
| 1g. Remaining scenes | Title, lobby, results screens via ScreenBuffer. | ⬜ |

### Phase 2: Particle & Effect System

| Task | Description | Status |
|------|-------------|--------|
| 2a. Render state | `RenderState` object for particles, timers, screen effects. | ⬜ |
| 2b. Particle engine | Spawn/update/cull particles — explosion sparks, projectile trails, death bursts. | ⬜ |
| 2c. Screen effects | Screen shake (draw offset), flash (color overlay on damage), hit markers. | ⬜ |

### Phase 3: Ambience & Transitions

| Task | Description | Status |
|------|-------------|--------|
| 3a. Background ambience | Drifting dim void particles, subtle color noise on arena floor. | ⬜ |
| 3b. Scene transitions | Fade/wipe effects between scenes (title→lobby→gameplay→results). | ⬜ |
| 3c. Animated title | Pulsing/glowing title text, starfield or void-themed background. | ⬜ |

### Phase 4: Polish & Content

| Task | Description | Status |
|------|-------------|--------|
| 4a. Extended sprite library | Unique multi-cell sprites per enemy kind, pickups, hazards. | ⬜ |
| 4b. Color palettes | 256-color / truecolor gradients for health, energy, atmosphere. | ⬜ |
| 4c. Visual config | User-tunable settings — particle density, color mode, reduced-motion. | ⬜ |

---

## Design Decisions

### Why terminal-kit ScreenBuffer?

- **Cell-level control** — place characters with attributes at exact x,y positions, no string concatenation.
- **Native delta rendering** — `draw({delta: true})` only writes changed cells. Replaces our custom `normalizeFrame`.
- **Sprite composition** — nested ScreenBuffers with `transparency: true` for layering sprites over backgrounds.
- **Attribute support** — fg, bg, bold, dim, blink per cell without manual ANSI escape juggling.

### Why keep renderer-ansi?

- Proven, works everywhere, no native deps.
- Useful as a lightweight/fallback renderer (CI, minimal terminals, SSH).
- Lets us develop `renderer-tk` incrementally without breaking the game.

### Sprite sizing

Players get 3×3 sprites (visually distinct at arena scale, fits within the 72×30 arena). Enemies are 1×1 or 2×2 depending on kind. Projectiles stay 1×1 but gain color trails via particles.

### RenderState is render-only

Particles, screen shake, flash timers — all live outside `GameState`. The simulation stays a pure function of commands → state. The renderer maintains its own transient state for visuals, updated each frame based on diffs between consecutive `GameState` snapshots (e.g., enemy removed → spawn explosion particles at its last position).

---

## Progress Log

_Updated as work progresses. Newest entries at top._

<!-- Example entry:
### 2026-05-17 — Phase 1a complete
- Scaffolded `packages/renderer-tk/` with terminal-kit dep
- Verified `pnpm typecheck` passes
-->

_(no entries yet)_
