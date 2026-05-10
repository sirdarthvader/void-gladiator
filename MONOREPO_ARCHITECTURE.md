# Void Gladiator - Monorepo Architecture

## Purpose

This document defines the workspace-level architecture for Void Gladiator as a monorepo.

It answers:

- why the project should be a monorepo
- which monorepo tools to use
- what packages should exist first
- what each package is responsible for
- which dependencies are allowed between packages
- how this structure supports future LAN multiplayer cleanly

This document complements [TECH_ARCHITECTURE.md](/Users/ashish.singh/Documents/personal/game/test1/TECH_ARCHITECTURE.md).

---

## Recommendation

Use:

- `pnpm` workspaces for package management
- `Nx` for workspace orchestration, affected runs, caching, and project graph management

## Why this combination

`pnpm` solves dependency management and workspace linking well.

`Nx` adds the parts that become valuable as soon as the repo has several packages:

- fast targeted builds and tests
- explicit project graph visibility
- clean project boundaries
- reusable task conventions
- room to grow into more apps and packages later

This is a better fit than a single-package setup because the project is expected to grow from:

- one single-player terminal app now

into potentially:

- a LAN host app or mode
- a LAN client app or mode
- shared protocol contracts
- networking transport packages
- replay or bot tooling later

---

## Why a Monorepo Is the Right Shape

The project has three long-term pressures:

1. the simulation must stay reusable
2. terminal concerns must stay isolated
3. multiplayer must be addable without cutting across everything

A monorepo helps because it encourages package boundaries around exactly those concerns.

This is not about making the repo look enterprise-heavy. It is about preventing the most common failure mode for game prototypes: one growing codebase with no clear ownership boundaries.

---

## Workspace Layout

Recommended top-level layout:

```text
test1/
  apps/
    cli-game/
  packages/
    game-core/
    engine-loop/
    renderer-ansi/
    terminal-input/
    content/
    persistence/
    shared/
    protocol/
    network-lan/
  tests/
    integration/
  docs/
    GAME_DESIGN.md
    VOID_GLADIATOR_SPEC.md
    TECH_ARCHITECTURE.md
    MONOREPO_ARCHITECTURE.md
  package.json
  pnpm-workspace.yaml
  nx.json
  tsconfig.base.json
  eslint.config.js
  .prettierrc
```

## Design rule

- runnable things go in `apps/`
- reusable internal libraries go in `packages/`
- cross-package integration tests go in `tests/`
- design and implementation docs go in `docs/`

---

## App Strategy

The MVP only needs one app.

## `apps/cli-game`

This is the actual terminal game executable.

Responsibilities:

- bootstrap the workspace runtime
- compose the engine and game packages
- start the terminal session
- run the main loop
- own process-level startup and shutdown behavior

This app should stay thin.

It should not become the place where simulation rules or renderer internals accumulate.

---

## Package Strategy

Each package should exist for one coherent reason.

## `packages/game-core`

This is the heart of the game.

Responsibilities:

- game state types
- commands and intent model
- simulation step
- player systems
- enemy systems
- collision and damage
- score and streak logic
- scene state and transitions

This package must stay free of terminal-specific APIs.

It should be the package that is easiest to test in isolation.

## `packages/engine-loop`

Responsibilities:

- fixed-tick runtime
- frame timing
- scheduler utilities
- small runtime orchestration primitives

This package is intentionally generic and should not know anything about Void Gladiator content.

## `packages/renderer-ansi`

Responsibilities:

- screen buffer model
- ANSI cursor movement and drawing
- frame diffing
- glyph and color output
- terminal-safe rendering helpers

This package can render public game state contracts, but it must not own gameplay rules.

## `packages/terminal-input`

Responsibilities:

- raw mode keyboard capture
- terminal key decoding
- held-key state tracking
- mapping input to normalized game commands

This package is the local input adapter.

Later, a remote input adapter can follow the same contracts.

## `packages/content`

Responsibilities:

- enemy definitions
- upgrade definitions
- wave definitions
- boss definitions
- balance constants and content metadata

Keeping content separate is useful because balance iteration is frequent and should not require touching simulation internals unnecessarily.

## `packages/persistence`

Responsibilities:

- save path selection
- high score storage
- config storage later
- file read and write helpers for persisted game data

## `packages/shared`

Responsibilities:

- math utilities
- common types used across packages when appropriate
- small data structures
- assertions and tiny generic helpers

This package should stay tight. If it becomes a dumping ground, the workspace boundaries will weaken quickly.

## `packages/protocol`

Responsibilities:

- message types
- command batch contracts
- state snapshot contracts
- serialization-safe protocol models

This package may start small, but it should exist early because future multiplayer depends on it.

## `packages/network-lan`

Responsibilities:

- LAN transport abstraction
- TCP socket implementation later
- client and host message flow helpers
- synchronization helpers once multiplayer begins

This package can stay mostly placeholder in the MVP, but the workspace should reserve the boundary now.

---

## Dependency Rules

Recommended dependency graph:

- `apps/cli-game` depends on `game-core`, `engine-loop`, `renderer-ansi`, `terminal-input`, `persistence`, and `content`
- `game-core` depends on `shared`, `content`, and `protocol` contracts where needed
- `renderer-ansi` depends on `shared` and public state contracts only
- `terminal-input` depends on `shared` and command contracts
- `engine-loop` depends on `shared`
- `persistence` depends on `shared`
- `network-lan` depends on `protocol` and `shared`
- `protocol` depends on `shared` only if the shared types are truly protocol-safe

## Hard rules

- `game-core` must not import terminal APIs
- `renderer-ansi` must not own gameplay rules
- `terminal-input` must not mutate game state directly
- `apps/cli-game` should compose packages, not absorb their logic
- `network-lan` must not become a dumping ground for game rules

---

## Package Creation Philosophy

The workspace should not split into dozens of packages immediately.

The goal is a small number of meaningful packages, not maximal decomposition.

## Create packages early for

- game-core
- engine-loop
- renderer-ansi
- terminal-input
- content
- persistence
- shared
- protocol

## Allow later growth for

- network-lan implementation details
- replay tools
- bots or AI test harnesses
- profiling or debugging tools

This keeps the workspace structured without turning it into ceremony.

---

## Recommended Nx Use

Use Nx for:

- project generation if useful
- task running across packages
- affected commands in CI or local development
- dependency graph inspection
- caching builds, tests, and linting

## Useful workflow targets

- build
- test
- lint
- dev
- typecheck

## Why Nx is valuable here

When the repo becomes multiplayer-aware, the number of packages and dependency edges grows. Nx will make it much easier to answer:

- what changed
- what needs rebuilding
- what can be tested in isolation
- whether package boundaries are still sane

---

## Versioning and Publishing

This monorepo is for one project, not for public package publishing.

That means internal packages should be treated as workspace packages, not as independently versioned external libraries.

Keep the versioning model simple until there is a real reason to publish anything.

---

## Test Strategy in a Monorepo

The package split should map directly to testing scope.

## Package-local tests

- `game-core`: systems, simulation, collisions, scoring, transitions
- `engine-loop`: timing behavior and scheduler helpers
- `renderer-ansi`: buffer and diff logic
- `terminal-input`: key decoding and command generation
- `persistence`: save and load behavior
- `protocol`: message validation and serialization shape

## Integration tests

Use `tests/integration/` for multi-package flows such as:

- command input flowing into simulation
- simulation state rendered into a frame buffer
- end-of-run state saved to persistence

This split keeps tests aligned with workspace boundaries.

---

## Multiplayer Growth Path

The monorepo should make the future LAN path straightforward.

## MVP phase

- one app: `cli-game`
- local input only
- no active network transport
- protocol contracts can remain thin

## LAN phase

Likely additions or expansions:

- richer `protocol` contracts
- real `network-lan` transport implementation
- host mode inside `cli-game` or a second dedicated app if needed
- client-side synchronization flow

## Why packages matter here

If simulation is already in `game-core`, networking can be added around it instead of through it.

That is the main architectural win.

---

## Recommended Initial Workspace Slice

The first implementation pass should create this minimum viable workspace:

```text
apps/
  cli-game/
packages/
  game-core/
  engine-loop/
  renderer-ansi/
  terminal-input/
  content/
  persistence/
  shared/
  protocol/
```

`network-lan` can be created immediately as a placeholder package or added right after the MVP spine is established.

## Why this slice is enough

It gives:

- one runnable app
- clean package seams
- clear test boundaries
- a place for future protocol and networking work

without overbuilding the workspace before gameplay exists.

---

## Final Recommendation

The best fit for this project is a `pnpm` + `Nx` monorepo with one runnable terminal app and a small set of focused internal packages.

That gives enough engineering structure to support future LAN multiplayer cleanly while keeping the first single-player build practical and fast to iterate on.
