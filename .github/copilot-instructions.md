# Copilot Instructions — Void Gladiator

## Project Overview

Void Gladiator is a real-time top-down ASCII arena shooter built as a terminal game. It uses a fixed-tick simulation loop (30 Hz), custom ANSI rendering, and a command-driven architecture designed to support future LAN multiplayer without rewriting game logic.

## Build, Test, and Lint

```bash
# Run the game in dev mode
pnpm dev                  # or: nx run cli-game:dev

# Type-check all packages
pnpm typecheck

# Lint
pnpm lint

# Run all tests
pnpm test

# Run a single test file
pnpm exec vitest run tests/integration/movement.test.ts

# Run tests matching a pattern
pnpm exec vitest run -t "pattern"

# Nx project graph
pnpm graph
```

- Package manager: **pnpm** (v10, workspace mode)
- Task orchestration: **Nx** (affected runs, caching, project graph)
- Test runner: **Vitest** (run from root)
- Dev runner: **tsx** (for `apps/cli-game`)

## Architecture

### Monorepo Layout

```
apps/cli-game/         → Thin app shell: bootstraps engine, wires packages, owns process lifecycle
packages/
  game-core/           → Simulation: state, commands, movement, collision, scoring, scenes
  engine-loop/         → Generic fixed-tick timer (no game knowledge)
  renderer-ansi/       → Converts GameState into ASCII frame strings
  terminal-input/      → Raw TTY capture, key decoding, command emission
  content/             → Static game constants (arena size, title)
  persistence/         → High score load/save via filesystem
  shared/              → Math utilities (Point, clamp) — keep small
  protocol/            → GameCommand union type, CommandBatch, CommandEnvelope
  network-lan/         → Placeholder for future LAN transport
tests/integration/     → Cross-package integration tests
```

### Dependency Flow (strict layering)

```
cli-game → game-core, engine-loop, renderer-ansi, terminal-input, persistence, content, protocol
game-core → shared, content, protocol
renderer-ansi → game-core (state types only)
terminal-input → protocol
engine-loop → shared
network-lan → protocol
```

Hard rules:
- `game-core` must **never** import terminal or renderer APIs
- `renderer-ansi` must **never** contain gameplay logic — it only reads state
- `terminal-input` must **never** mutate game state directly
- Simulation consumes **normalized commands**, never raw key events

### Data Flow (single-player)

```
terminal-input → command buffer → game-core (tick) → GameState → renderer-ansi → stdout
```

The simulation is command-driven so it can later accept commands from a network source without changes.

## Key Conventions

### Package Structure

- Each package exposes a single barrel: `src/index.ts`
- App entry point: `src/main.ts`
- Package names: `@void-gladiator/*` (e.g., `@void-gladiator/game-core`)
- Internal dependencies use `"workspace:*"` in package.json
- Package exports declared as `"./src/index.ts"` (source-level, not compiled)

### TypeScript Patterns

- **Type-only imports are enforced** via ESLint (`@typescript-eslint/consistent-type-imports: error`)
  ```typescript
  import type { GameCommand } from '@void-gladiator/protocol';
  ```
- **Discriminated unions** for commands and protocol messages (switch on string literal)
- **Immutable state updates** via spread — simulation uses a reducer pattern
- **Small pure functions** preferred in simulation code
- **Closure-based modules** (e.g., `createTicker()` returns `{ start, stop }`)
- Target: ES2022, module: NodeNext
- Unused vars prefixed with `_` (enforced by ESLint)

### Formatting

- Prettier: single quotes, semicolons, trailing commas (es5)
- No tabs — use spaces

### Game Simulation Rules

- State is plain serializable data (no classes with hidden mutation)
- All game commands are string literals defined in `packages/protocol`
- The simulation must remain deterministic and testable in isolation
- Content (enemies, upgrades, waves) lives as typed data in `packages/content`, separate from systems

### Adding a New Package

1. Create `packages/<name>/` with `package.json`, `project.json`, `tsconfig.json`, `src/index.ts`
2. Use `@void-gladiator/<name>` as the package name
3. Add `"workspace:*"` deps for other internal packages
4. Follow the dependency flow rules above

## Design Documents

Key design context lives in root markdown files:
- `VOID_GLADIATOR_SPEC.md` — Locked game design spec (enemies, upgrades, controls, MVP scope)
- `TECH_ARCHITECTURE.md` — Technical architecture decisions
- `MONOREPO_ARCHITECTURE.md` — Package boundaries and dependency rules
- `GAME_DESIGN.md` — Original brainstorm and design exploration
