# Void Gladiator - Technical Architecture

## Purpose

This document defines the technical plan for implementing Void Gladiator.

It is intended to be the primary engineering reference for:

- project scaffolding
- monorepo workspace structure
- folder structure
- code organization
- runtime design
- game-state architecture
- rendering strategy
- persistence
- future LAN multiplayer expansion

This document should be used alongside [VOID_GLADIATOR_SPEC.md](/Users/ashish.singh/Documents/personal/game/test1/VOID_GLADIATOR_SPEC.md).

---

## Technical Goals

The architecture should optimize for these goals:

1. fast local iteration during development
2. responsive terminal rendering for arcade gameplay
3. deterministic and testable simulation logic
4. clean separation between engine, game rules, and terminal concerns
5. minimal friction for adding LAN host/client support later
6. simple enough structure to stay productive as a solo project

---

## Final Stack

## Runtime and language

- Node.js
- TypeScript

## Workspace tooling

- `pnpm` workspaces
- `Nx` for task orchestration, project graph, caching, and affected runs

## Rendering

- custom ANSI terminal renderer
- raw stdout writes for frame output
- terminal input via stdin in raw mode

## Tooling

- TypeScript compiler for builds
- `tsx` for local development runs
- ESLint for code quality
- Prettier for formatting
- Vitest for unit tests on simulation and helpers

## Optional support libraries

The goal is to keep runtime dependencies minimal.

Recommended dependencies:

- `kleur` or `picocolors` for light terminal color utilities if needed
- `signal-exit` only if terminal cleanup needs a stable cross-platform helper

Recommended dev dependencies:

- `nx`
- `typescript`
- `tsx`
- `vitest`
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `prettier`
- `eslint-config-prettier`
- `@types/node`

## Why not a TUI framework

Void Gladiator is a real-time action game, not a form-driven terminal app.

A custom renderer is the right choice because it gives direct control over:

- frame timing
- redraw behavior
- buffer diffing
- HUD composition
- effects such as flashes and shake
- future spectator or network state rendering

---

## Workspace Strategy

The project should be built as a monorepo from the start.

## Recommendation

Use:

- `pnpm` for workspace and dependency management
- `Nx` for task running, caching, project graph visibility, and incremental builds/tests

## Why this is the right choice

- separate packages can evolve without forcing a rewrite later
- networking can be added as new packages instead of being tangled into the first app
- simulation, protocol, renderer, and input can be tested independently
- `Nx` gives useful structure once the repo grows past a few packages

## Why not plain pnpm only

Plain pnpm workspaces would work, but `Nx` is worth it here because the project is intended to become modular over time and will likely benefit from:

- affected commands
- dependency graph awareness
- cached builds and tests
- explicit project boundaries

## Why not lead with a heavier build system

This project does not need Bazel-level complexity. `pnpm` plus `Nx` is enough structure without becoming a maintenance project.

---

## Packaging Strategy

## Initial target

During early development, optimize for local execution using:

- a monorepo with one runnable app and several internal packages
- `tsx` for local development of the CLI game app
- package-local or Nx-managed TypeScript builds to `dist/`

## Build target

Production build can remain standard Node output initially:

- compile the runnable app and dependent packages to JavaScript
- run the built CLI app via Node on the target machine

Later, if distribution becomes important, this can be extended to:

- `pkg`
- `nexe`
- platform-specific packaging scripts

That is not needed for the first implementation phase.

---

## Project Structure

The detailed package layout lives in [MONOREPO_ARCHITECTURE.md](/Users/ashish.singh/Documents/personal/game/test1/MONOREPO_ARCHITECTURE.md).

At a high level, the workspace should look like this:

```text
test1/
  docs/
    GAME_DESIGN.md
    VOID_GLADIATOR_SPEC.md
    TECH_ARCHITECTURE.md
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
  package.json
  pnpm-workspace.yaml
  nx.json
  tsconfig.json
  eslint.config.js
  .prettierrc
```

## Important note

The current repo stores design docs at root. Once scaffolding starts, those files should move under `docs/` to keep the workspace clean.

---

## Folder Responsibilities

## `apps/cli-game`

Owns application startup and orchestration.

Responsibilities:

- bootstrapping dependencies
- starting the terminal session
- selecting the initial scene
- running the main loop
- shutting down cleanly

This is the outer shell of the program.

## `packages/engine-loop`

Contains reusable runtime primitives.

Responsibilities:

- fixed update loop
- frame timing
- terminal access
- input capture
- rendering buffer and diff flush

This layer should know nothing about Void Gladiator enemies, weapons, or score.

## `packages/game-core`

Contains all game-specific rules and content.

Responsibilities:

- entity logic
- combat systems
- wave progression
- scene transitions
- content definitions
- score logic

This is the main gameplay layer.

## `packages/persistence`

Handles filesystem-backed data.

Responsibilities:

- high score storage
- future settings storage
- platform-safe save paths

## `packages/protocol` and `packages/network-lan`

These packages should exist early even if `network-lan` starts nearly empty.

Responsibilities:

- protocol contracts
- interfaces for transport and command sources
- future host/client synchronization seam

The presence of these packages early is intentional. It prevents the project from hardwiring local-only assumptions into game logic.

## `packages/renderer-ansi`

Contains the terminal rendering implementation.

Responsibilities:

- ANSI screen buffer management
- diffing and frame flush
- color and glyph rendering helpers
- HUD and scene projection helpers where appropriate

This package may understand public game-state shapes, but gameplay rules must not live here.

## `packages/terminal-input`

Contains terminal input capture and normalization.

Responsibilities:

- raw terminal key capture
- input event decoding
- mapping keypresses into normalized commands

## `packages/content`

Contains typed content definitions.

Responsibilities:

- enemies
- upgrades
- waves
- boss definitions

## `packages/shared`

Holds generic utilities that are not specific to engine or gameplay.

Responsibilities:

- math helpers
- simple data structures
- tiny reusable utilities

This should stay small. Do not turn it into a dumping ground.

---

## High-Level Architecture

The program should be treated as a stack of layers with strict flow direction.

## Layer order

1. terminal and process shell
2. engine loop and IO primitives
3. game simulation and scenes
4. renderer output projection
5. persistence and future network adapters

## Dependency rule

Dependencies should generally flow inward and downward like this:

- `apps/cli-game` depends on `game-core`, `engine-loop`, `renderer-ansi`, `terminal-input`, `persistence`, `content`
- `game-core` depends on `shared`, `content`, and `protocol` types where needed
- `engine-loop` depends on `shared`
- `renderer-ansi` depends on `shared` and public game-state contracts only
- `terminal-input` depends on `shared` and command contracts
- `persistence` depends on `shared`
- `network-lan` depends on `protocol` and `shared`
- `protocol` depends on `shared` only when absolutely necessary

The `game-core` package should not import terminal-specific code.

The `engine-loop` package should not import game content.

The renderer can understand game state shape, but simulation must not depend on renderer details.

---

## Runtime Model

Void Gladiator should use a fixed-tick simulation model.

## Recommended rates

- simulation tick: 30 updates per second
- render target: 30 frames per second initially

This can later become:

- fixed simulation at 30 Hz
- render as fast as practical with interpolation if needed

For the MVP, matching update and render cadence is simpler and sufficient.

## Main loop responsibilities

Each loop cycle should:

1. collect terminal input events
2. normalize them into game commands
3. enqueue commands for the next simulation step
4. update the active scene and simulation
5. build a frame buffer from current state
6. diff against previous frame if implemented
7. flush ANSI output

## Why fixed tick matters

- more consistent collisions
- easier gameplay tuning
- more deterministic tests
- easier future host-authoritative networking

---

## Scene Architecture

The game should use scene-driven application flow.

## Initial scenes

- title scene
- run scene
- upgrade scene
- game over scene

## Scene contract

Each scene should own:

- input handling rules for that scene
- update logic for that scene
- render projection for that scene
- transition conditions to other scenes

## Why scenes matter

Without scene boundaries, pause, upgrade selection, and game-over handling tend to leak logic into the main simulation loop.

Scenes keep state transitions explicit and manageable.

---

## Simulation Architecture

The simulation should be command-driven and state-first.

## Core model

At each tick:

1. read queued commands
2. transform simulation state
3. emit transient events for feedback and UI

## State domains

The runtime game state should be split into a few explicit domains:

### run state

- current scene
- paused flag
- elapsed run time
- current wave

### world state

- arena bounds
- active entities
- projectiles
- hazards
- pickups if added later

### player state

- position
- facing
- health
- cooldowns
- special charge
- active upgrades
- score multiplier state

### ui state

- announcement banners
- warning messages
- upgrade selection options
- special ready pulses

### transient effects state

- hit flashes
- shake intensity
- brief freeze-frame timers

### persistence-facing state

- score
- highest wave this run
- end-of-run summary

## State shape principle

Prefer plain serializable data structures over classes with hidden mutable behavior.

That makes the simulation easier to:

- test
- snapshot
- debug
- replicate across a future host/client boundary

---

## Command Model

The game should normalize input into a command stream before simulation consumes it.

## Example command set

- move up start
- move up stop
- move down start
- move left start
- move right start
- fire press
- fire release
- dash press
- special press
- pause press
- confirm press
- cancel press

## Why this matters

This model creates a clean seam between:

- local keyboard input now
- remote network input later
- replay recording later if desired

The simulation should never ask whether a key is physically down. It should only consume normalized command state.

---

## Suggested Update Pipeline

Within the run scene, the simulation step should follow a stable order.

## Per-tick order

1. resolve input into player intent
2. update player movement and facing
3. process dash and weapon triggers
4. update enemy AI intentions
5. move projectiles and enemies
6. resolve collisions
7. apply damage and death
8. process scoring and streaks
9. update effects and UI events
10. check wave completion and transitions

## Why order matters

Stable system ordering keeps combat behavior predictable and easier to tune.

---

## Entity Model

A lightweight structured entity model is the right starting point.

## Recommendation

Do not introduce a full ECS framework for the MVP.

Use a pragmatic typed model such as:

- player object
- arrays for enemies and projectiles
- typed discriminated unions for entity kinds
- system functions that operate on state slices

## Why not ECS yet

- more setup cost
- less clarity for a small action game
- no strong payoff at current scope

If complexity grows significantly later, the system-oriented code organization will still make refactoring possible.

---

## Rendering Architecture

The renderer should convert current scene state into a frame buffer and flush it efficiently.

## Renderer responsibilities

- clear or reuse buffer
- draw border and arena
- draw entities in priority order
- draw projectiles and hazards
- draw HUD
- apply lightweight effects
- flush to terminal

## Buffer model

Use a 2D screen buffer that stores per-cell:

- glyph
- foreground color
- background color
- style flags if needed later

## Rendering order

Suggested draw order:

1. background and border
2. hazards
3. pickups if any
4. enemies
5. player
6. projectiles
7. overlays and UI

This may be adjusted for readability after playtesting.

## Diff writing

The renderer should be designed with optional frame diffing.

That means:

- keep previous frame buffer
- compare changed cells only
- write only changed runs where worthwhile

For the earliest prototype, a full redraw may be acceptable. But the renderer API should not block later optimization.

## Terminal behavior

The terminal session should manage:

- entering alternate screen if desired
- hiding the cursor
- enabling raw input mode
- restoring terminal state on exit or crash path

---

## Terminal Constraints

The code should explicitly handle terminal limitations.

## Minimum size policy

If the terminal is too small:

- pause gameplay startup
- show a clear resize message
- resume only when dimensions are acceptable

## Resize handling

The renderer should be able to respond to terminal resize events.

For MVP, the safe policy is:

- pause simulation
- redraw layout
- continue when size is valid

## Cross-platform expectations

Primary target is macOS and Linux terminals first.

Windows support can come later unless it arrives naturally from Node terminal behavior.

---

## Input Architecture

The input layer should convert raw terminal bytes or key events into a normalized input state and command buffer.

## Input responsibilities

- decode keypresses
- track held movement directions
- detect edge-triggered actions such as dash and special
- emit commands to the active scene or simulation

## Input policy

Movement should be stateful.

Examples:

- holding `W` keeps moving up
- pressing `K` emits a dash command once
- pressing `J` emits a special command once

## Input abstraction

Define an `InputSource` interface early.

Potential implementations later:

- local keyboard source
- replay source
- remote network source
- bot input source for tests

---

## Persistence Architecture

Persistence should be minimal and isolated.

## MVP persisted data

- highest score
- highest wave reached
- maybe a small recent run summary later

## File format

Use JSON for simplicity.

## Save path strategy

Use a stable app-specific path under the user home directory rather than writing into the project folder at runtime.

Example strategy:

- macOS and Linux: a hidden folder or app data folder under the user home directory

The path helper should centralize this logic so it can change later without touching game code.

---

## Content Architecture

Enemy, upgrade, and wave configuration should live as structured data definitions, not hardcoded inside systems.

## Content files should define

- ids
- stats
- cooldowns
- projectile properties
- spawn weights or scripted wave lists
- display metadata such as glyphs and colors

## Benefits

- easier balancing
- easier testing
- easier iteration without changing simulation plumbing
- future possibility of seeded content generation

---

## Error Handling and Shutdown

Because this is a terminal application, shutdown behavior matters.

The app should always try to restore:

- cursor visibility
- raw mode changes
- alternate screen state if used

## Failure policy

If a fatal runtime error occurs:

- restore terminal state first
- print error after cleanup
- exit non-zero

This prevents the terminal from being left in a broken state during development.

---

## Testing Strategy

The simulation core should be designed for testability from day one.

## Unit test targets

- collision detection
- movement clamping
- dash cooldown logic
- projectile lifetime logic
- enemy behavior helpers
- wave progression rules
- score and streak logic

## Integration-like test targets

- one simulation tick with a command batch
- elite wave transitions
- run start and run end state transitions

## Renderer tests

Keep renderer tests focused and cheap:

- buffer composition
- diff generation
- HUD rendering snapshots where useful

Do not overinvest in renderer golden tests until the rendering API settles.

---

## Multiplayer-Ready Boundaries

LAN multiplayer is not part of the MVP, but the architecture should preserve the right seams.

## Authoritative model

The host machine will later run the authoritative simulation.

Responsibilities of host later:

- receive commands from both players
- validate command timing
- advance simulation
- resolve collisions and damage
- distribute snapshots or state deltas

Responsibilities of client later:

- capture local input
- send commands to host
- render synchronized state

## What to preserve now

- command-driven simulation
- serializable state
- clear scene boundaries
- no renderer-owned gameplay state
- no keyboard-specific assumptions inside systems

## Networking recommendation for later

Start with TCP sockets on a local network using a compact JSON protocol for simplicity.

Potential later protocol shape:

- `join`
- `start_match`
- `input_batch`
- `state_snapshot`
- `state_delta`
- `match_end`

Binary encoding can wait until there is proof JSON becomes a bottleneck.

---

## Suggested Internal Interfaces

These do not need to be fully implemented immediately, but the code should lean toward them.

## Engine-facing

- `TerminalSession`
- `Renderer`
- `InputSource`
- `Ticker`

## Game-facing

- `Scene`
- `SimulationStep`
- `CommandBuffer`
- `RunState`
- `WorldState`

## Future network-facing

- `CommandSource`
- `SnapshotPublisher`
- `Transport`

This is enough structure to guide implementation without overdesigning the project.

---

## Code Style Guidance

This project should favor:

- small pure functions in simulation code
- explicit data flow
- minimal inheritance
- descriptive type names
- content defined as typed objects

Avoid:

- giant god objects
- hidden mutable singleton state
- renderer logic mixed into gameplay rules
- deeply coupled scene and system code

---

## Recommended Initial Deliverables

When implementation begins, the first scaffolding pass should create:

1. pnpm workspace and Nx configuration
2. `apps/` and `packages/` layout with the core package boundaries
3. terminal session abstraction and engine loop package
4. screen buffer and simple ANSI renderer package
5. local keyboard input package
6. game-core package with scene and state contracts
7. one runnable CLI app with an empty arena render

That will establish the full technical spine before game content grows.

---

## Milestone Mapping

## Milestone 1: Engine skeleton ✅

- project scaffold
- main loop
- terminal session
- buffer renderer
- player movement in arena

## Milestone 2: Combat sandbox ✅

- primary fire
- projectiles
- collision
- enemy spawn plumbing

## Milestone 3: Core game loop

- waves
- scoring
- game over
- title scene

## Milestone 4: Depth systems

- dash
- special
- upgrades
- elite fights

## Milestone 5: content and polish

- boss
- feedback refinement
- persistence polish
- performance cleanup

---

## Final Guidance

The architecture should be disciplined but not ceremonial.

The right approach is:

- isolate engine concerns
- keep simulation data-oriented
- render from state only
- treat commands as the seam between input and gameplay
- leave clear space for a future LAN host/client model

If this structure is followed, the project can stay simple in the single-player phase without becoming disposable when multiplayer work begins later.
