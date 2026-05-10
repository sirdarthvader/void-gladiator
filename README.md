# Void Gladiator

A real-time top-down ASCII arena shooter played entirely in the terminal. Survive escalating waves of enemies in short, high-pressure arcade runs — rendered with ANSI escape sequences and driven by a deterministic fixed-tick simulation loop.

## Prerequisites

| Tool       | Version  | Install                                      |
| ---------- | -------- | -------------------------------------------- |
| Node.js    | ≥ 18     | [nodejs.org](https://nodejs.org/)            |
| pnpm       | 10.x     | `corepack enable && corepack prepare pnpm@10 --activate` |
| Nx         | ≥ 20     | Included as a dev dependency                 |

> **Note:** The `preinstall` script automatically runs `corepack enable` to pin pnpm to the version declared in `package.json`. No manual setup needed — just run `pnpm install` and Corepack takes care of the rest.

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url> && cd void-gladiator

# 2. Install dependencies (also activates corepack)
pnpm install

# 3. Run the game
pnpm dev
```

## Scripts

All scripts are run from the repository root:

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Launch the game in dev mode (`tsx` hot-reload)      |
| `pnpm typecheck` | Type-check every package                            |
| `pnpm lint`      | Lint all TypeScript files (ESLint + Prettier rules) |
| `pnpm test`      | Run the full test suite (Vitest)                    |
| `pnpm graph`     | Open the Nx dependency graph in your browser        |

### Running individual tests

```bash
# Single file
pnpm exec vitest run tests/integration/movement.test.ts

# By pattern
pnpm exec vitest run -t "pattern"
```

## Project Structure

```
apps/
  cli-game/              → App shell: bootstraps engine, wires packages, owns process lifecycle

packages/
  game-core/             → Simulation: state, commands, movement, collision, scoring, scenes
  engine-loop/           → Generic fixed-tick timer (no game knowledge)
  renderer-ansi/         → Converts GameState → ASCII frames via ANSI escape codes
  terminal-input/        → Raw TTY capture, key decoding, command emission
  content/               → Static game constants (arena size, title, enemies, upgrades)
  persistence/           → High-score load/save (filesystem)
  protocol/              → GameCommand union type, CommandBatch, CommandEnvelope
  shared/                → Math utilities (Point, clamp) — intentionally small
  network-lan/           → Placeholder for future LAN multiplayer transport

tests/
  integration/           → Cross-package integration tests
```

## Architecture Overview

The game uses a **command-driven architecture** designed to support future LAN multiplayer without rewriting game logic.

### Data flow (single-player)

```
terminal-input → command buffer → game-core (tick) → GameState → renderer-ansi → stdout
```

### Dependency rules

```
cli-game → game-core, engine-loop, renderer-ansi, terminal-input, persistence, content, protocol
game-core → shared, content, protocol
renderer-ansi → game-core (state types only)
terminal-input → protocol
engine-loop → shared
network-lan → protocol
```

**Hard rules to follow:**

- `game-core` must **never** import terminal or renderer APIs
- `renderer-ansi` must **never** contain gameplay logic — it only reads state
- `terminal-input` must **never** mutate game state directly
- The simulation consumes **normalized commands**, never raw key events

## Coding Conventions

### TypeScript

- **Type-only imports are enforced** — use `import type { ... }` for types
- **Discriminated unions** for commands and protocol messages
- **Immutable state updates** via spread (reducer pattern)
- **Closure-based modules** (e.g., `createTicker()` returns `{ start, stop }`)
- State is plain serializable data — no classes with hidden mutation
- Unused variables must be prefixed with `_`
- Target: `ES2022` / Module: `NodeNext`

### Formatting

- Prettier: single quotes, semicolons, trailing commas (`es5`)
- Spaces, not tabs

### Package conventions

- Each package exposes a single barrel: `src/index.ts`
- Package names: `@void-gladiator/<name>`
- Internal deps use `"workspace:*"` in `package.json`

## Adding a New Package

1. Create `packages/<name>/` with `package.json`, `project.json`, `tsconfig.json`, and `src/index.ts`
2. Use `@void-gladiator/<name>` as the package name
3. Add `"workspace:*"` deps for internal packages
4. Follow the dependency rules above — never introduce a circular dependency

## Design Documents

Deeper design context lives in the root:

| Document                   | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `VOID_GLADIATOR_SPEC.md`  | Locked game design spec (enemies, upgrades, controls, MVP) |
| `TECH_ARCHITECTURE.md`    | Technical architecture decisions                           |
| `MONOREPO_ARCHITECTURE.md`| Package boundaries and dependency rules                    |
| `GAME_DESIGN.md`          | Original brainstorm and design exploration                 |

## Contributing

1. **Pick an area** — check open issues or the design docs for what needs work.
2. **Create a branch** — use a descriptive name like `feat/enemy-ai` or `fix/collision-edge`.
3. **Make your changes** — follow the coding conventions above.
4. **Validate before pushing:**
   ```bash
   pnpm typecheck && pnpm lint && pnpm test
   ```
5. **Open a PR** — describe what changed and why. Link to the relevant design doc or issue.

## License

Private — not yet published.
