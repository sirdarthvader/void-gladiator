# ASCII Duel - Game Design Brainstorm

## Goal

Design a fast, fun, single-player terminal arcade game with shooting, simple controls, short runs, and strong replay value.

This document stays intentionally pre-code. The aim is to converge on a game that is:

- easy to start building
- satisfying within a terminal UI
- designed for single-player first
- structured so multiplayer can be explored later without rewriting the whole game

---

## Core Direction

### Recommended pitch

Build a **single-screen ASCII arena shooter** where the player duels against waves of enemy gunslingers, drones, or rival ships inside a compact arena.

The feel should be:

- immediate
- readable in plain text
- arcade-like rather than simulation-heavy
- difficult enough to create tension
- full of small tactical choices rather than complex systems

This is stronger than a literal 1v1 duel simulator because it gives more room for variety, score-chasing, and progression while still preserving the "duel" fantasy.

### Working fantasy

You enter an ASCII arena. Enemies spawn in rounds. You dodge, shoot, dash, use limited special shots, and survive as long as possible. Every few rounds, a champion enemy appears that feels like a true duel.

This gives you both:

- **arcade survival gameplay** for replayability
- **duel moments** for identity and tension

---

## Why This Fits a TUI Game

Terminal games work best when they emphasize:

- clean silhouettes
- low input complexity
- strong rhythm
- readable motion
- score pressure

A top-down or side-view ASCII shooter works better than systems-heavy RPG design because the player can parse the screen quickly.

The design should avoid:

- large maps
- dense UI overlays
- many simultaneous resource systems
- tiny projectiles that are hard to track in a terminal

---

## Three Strong Concept Options

## Option 1: Arena Duel Survivor

### Premise

You are a lone duelist surviving waves in a closed arena.

### Core loop

1. Move and shoot.
2. Survive the wave.
3. Pick 1 upgrade from 2-3 choices.
4. Face tougher enemy patterns.
5. Reach a boss duel.

### Why it works

- easiest to build
- very replayable
- strong fit for ASCII readability
- easy to expand with enemy types and upgrades

### Risk

Can feel generic unless the duel identity is strong.

---

## Option 2: Duel Train / Ladder Mode

### Premise

You fight one enemy at a time in a sequence of increasingly dangerous duels.

### Core loop

1. Enter a compact duel room.
2. Read opponent pattern.
3. Win the duel.
4. Take a reward or rule modifier.
5. Continue until death.

### Why it works

- very focused identity
- easier to communicate enemy personality
- each fight feels memorable

### Risk

Less chaotic and less arcade-like. If the enemy AI is not interesting, the game can feel flat.

---

## Option 3: Zone Control Shooter

### Premise

You battle inside an arena where control points, power cells, or shrinking danger zones force movement.

### Core loop

1. Move to safe or valuable spaces.
2. Fight enemies while managing area pressure.
3. Use pickups and abilities to hold position.
4. Survive escalating hazards.

### Why it works

- stronger movement decisions
- more tactical than pure kiting
- terminal arena becomes more dynamic

### Risk

Slightly more systems complexity and more UI explanation needed.

---

## Recommendation

Start with **Option 1: Arena Duel Survivor**, but borrow these ideas:

- from Option 2: named elite enemies and boss duels
- from Option 3: occasional arena hazards or control pressure

That gives a game with clear scope and stronger identity.

---

## Recommended Game Vision

## Elevator pitch

An ASCII arena shooter where each run is a survival duel against increasingly dangerous rivals. Move, shoot, dash, and outplay enemy patterns in a compact terminal battlefield.

## Design pillars

### 1. Readability first

Everything on screen must be instantly legible.

### 2. Skill before complexity

Depth should come from timing, positioning, and enemy pressure, not lots of buttons.

### 3. Short, replayable runs

A run should feel good in 5-15 minutes.

### 4. High tension moments

Near misses, narrow escapes, and boss standoffs should define the experience.

### 5. Expandable architecture

Even as a single-player game, separate input, simulation, rendering, and networking concerns early.

---

## Concrete Gameplay Proposal

## Perspective

Use a **top-down arena**.

Why:

- easiest to render in a grid
- easiest to reason about collisions
- simplest foundation for future multiplayer
- supports dodging and projectile play naturally

## Player actions

Keep the action set tight:

- move in 4 or 8 directions
- fire main weapon
- dash with short cooldown
- use alt fire or charged shot

Do not start with more than these four actions.

## Arena size

Something like:

- 40x20
- 50x25
- 60x25

Large enough for movement, small enough for constant pressure.

## Player stats

Keep stats simple:

- health
- dash cooldown
- weapon cooldown
- score
- combo or streak meter optional

Avoid stamina, armor types, inventory, and ammo in the first version unless one of them becomes central to the fantasy.

---

## Combat Model

## Weapons

Start with three weapon archetypes that share the same input:

### Revolver / Blaster

- medium fire rate
- accurate
- reliable default

### Spread shot

- wider attack cone
- strong at close range
- weaker at range

### Rail shot / Pierce shot

- slower cadence
- high damage
- can pierce one or more enemies

The player should likely begin each run with one default weapon, then unlock modifiers rather than full weapon swapping immediately.

## Dash

Dash is important because it creates fun in a terminal game even when animation is limited.

Dash can:

- reposition quickly
- briefly grant invulnerability or partial invulnerability
- reward precise timing

This becomes one of the main skill expressions.

## Special system

Choose one of these, not all:

### Special shot charges over time

- simple to understand
- adds excitement

### Heat meter

- stronger firing builds heat
- overheating temporarily weakens fire

### Risk meter

- aggressive play fills a meter
- higher meter gives damage bonus but increases danger

Best starting choice: **special shot charges over time**.

---

## Enemy Design

Enemy variety will matter more than raw content count.

Start with 4-5 enemy behaviors.

## Suggested enemy roster

### Chaser

- moves directly toward the player
- low health
- teaches kiting

### Shooter

- keeps some distance
- fires straight projectiles
- basic duel pressure

### Dasher

- pauses, then lunges
- creates timing checks

### Turret / Anchor

- stationary or slow
- controls space with repeated shots
- forces route changes

### Elite Duelist

- mirrors core player fantasy
- dodges occasionally
- has readable attack phases

## Boss concept examples

### The Mirror

A rival who also dashes and fires in bursts.

### The Bulwark

A slow boss that fills the arena with patterns and must be out-positioned.

### The Hunter

A boss that stalks, disappears briefly, then reappears for aggressive attacks.

---

## Making It Actually Fun

Fun in this kind of game usually comes from these layers:

## 1. Tight feedback

The player must clearly understand:

- when they fired
- what they hit
- when they took damage
- when a dash saved them

In TUI form, feedback can come from:

- color changes
- brief glyph swaps
- hit flashes
- screen shake simulation via slight viewport offset
- score pop text

## 2. Frequent micro-decisions

The player should constantly choose:

- keep distance or push in
- spend dash now or save it
- focus weak enemies or pressure the elite
- take the safer route or chase score

## 3. Run variety

Even a small amount of upgrade variety can make runs feel different.

## 4. Pressure curve

The game should alternate between:

- calm control
- rising pressure
- panic
- recovery
- boss tension

If the pressure is flat, the game gets dull quickly.

---

## Progression Structure

## In-run progression

After every wave or every 2-3 waves, offer one choice from a small set.

Examples:

- +1 projectile on special shot
- shorter dash cooldown
- shots pierce one target
- kill streak grants brief speed boost
- low health increases fire rate
- enemies explode on death

Keep upgrades dramatic and readable.

Avoid tiny stat bumps like +3% damage early on.

## Meta progression

For the first version, consider **no permanent progression** or only cosmetic/stat-tracking progression.

Why:

- keeps balancing simpler
- focuses on skill and replay value
- reduces design sprawl

Possible lightweight meta systems later:

- unlocked starting loadouts
- new enemy sets
- alternate arenas
- visual palettes

---

## Game Modes

For phase 1, design around one mode only:

## Survival mode

- endless or wave-based
- score-driven
- strongest MVP choice

Potential later additions:

- boss rush
- duel ladder
- daily seed challenge

---

## Tone and Theme Options

The mechanics are flexible. Pick a theme that gives personality.

## Theme A: Neon Gunslinger

- cyber-western duels
- ASCII saloon / arena vibes
- strong identity

## Theme B: Rogue Drone Arena

- ships, drones, sentries
- easier to justify waves and projectiles
- clean techno presentation

## Theme C: Void Gladiator

- abstract geometric enemies
- minimal but stylish
- easiest to render elegantly in ASCII

## Recommendation

Pick **Neon Gunslinger** if you want personality.

Pick **Rogue Drone Arena** if you want implementation clarity.

For a first TUI project, **Rogue Drone Arena** is probably the most practical because simple ASCII symbols map cleanly to machines and bullets.

---

## ASCII Presentation Ideas

Examples of readable symbols:

- player: `@` or `A`
- enemy grunt: `g`
- elite: `E`
- boss: `B`
- player bullet: `-` `>` `|`
- enemy bullet: `.` `*` `o`
- wall: `#`
- pickup: `+`
- hazard: `~`

You can also use directional glyphs for flavor if readability holds.

Important rule:

The player should never wonder which glyph matters most. Player, enemy bullets, and elite enemies must stand out immediately.

---

## Control Scheme

Best initial controls:

- `WASD` for movement
- arrow keys or `IJKL` for aiming if twin-stick style
- `Space` for fire if auto-aim or facing-based firing
- `Shift` or `K` for dash
- `J` or `L` for special

There are two main approaches:

## Approach 1: Move + facing direction

Player moves, and shots fire in current facing direction.

Pros:

- simpler input model
- better for terminal constraints

Cons:

- less expressive

## Approach 2: Twin-stick keyboard style

Movement on `WASD`, aiming on arrows or `IJKL`.

Pros:

- more skill expression
- stronger action feel

Cons:

- harder to learn
- more demanding in a terminal

## Recommendation

Start with **Move + facing direction**, or even **auto-fire toward nearest enemy within a cone** for early prototypes.

That keeps the game fun faster.

---

## Difficulty Model

Difficulty should escalate through pattern composition, not just bigger numbers.

Ways to increase difficulty:

- more enemies on screen
- mixed enemy types
- faster projectiles
- denser spawn timing
- arena hazards
- elite enemies with boss-like behavior

Avoid relying only on health inflation.

---

## Score and Replayability

Strong score systems help arcade games a lot.

Possible scoring hooks:

- enemy kills
- wave clear bonus
- no-damage bonus
- close-call bonus
- kill streak multiplier
- boss speed-clear bonus

Recommendation:

Use a simple score plus streak multiplier. That creates tension without making the UI too busy.

---

## Scope Boundaries for Version 1

To keep this achievable, the first playable version should include only:

- one arena
- one player character
- one base weapon
- dash
- 4 enemy types
- 1 elite type
- wave progression
- score
- game over and restart

Optional but still reasonable for v1:

- 5-10 upgrades
- one boss
- basic color
- title screen
- high score persistence

Do not include in the first build:

- inventory
- story mode
- multiple playable classes
- procedural map generation
- online multiplayer
- sophisticated physics
- large menus and settings systems

---

## Tech Stack Discussion

You said Node + TypeScript is the default direction, but you are open to alternatives.

## Option A: Node.js + TypeScript

### Best libraries to consider

- `node` runtime
- `typescript`
- `ink` for React-style TUI rendering
- `neo-blessed` or `blessed` for lower-level terminal UI
- plain ANSI rendering with a custom loop for maximum control

### Strengths

- familiar ecosystem
- easy iteration
- good if you want architecture discipline
- TypeScript helps keep game state manageable

### Weaknesses

- terminal animation in React-style TUI can become awkward for real-time games
- some TUI libraries are better for apps than arcade loops

### My view

If you use Node + TS, I would **not** start with heavy React-style TUI abstractions for a real-time arcade game.

The strongest TS approach is likely:

- Node.js
- TypeScript
- raw terminal rendering with ANSI escape sequences, or a very thin terminal abstraction
- your own game loop

That gives better control over frame timing and rendering.

---

## Option B: Rust

### Strengths

- excellent performance
- strong architecture for deterministic simulation
- great for future networking and multiplayer experiments
- terminal ecosystem is solid

### Weaknesses

- higher initial complexity
- slower idea iteration if you are not already comfortable in Rust

### My view

Rust is arguably the best long-term technical choice for a serious terminal action game, but not necessarily the fastest path to a fun first prototype.

---

## Option C: Go

### Strengths

- simple concurrency model
- easy to ship binaries
- reasonable terminal libraries

### Weaknesses

- less expressive for game-state modeling than TypeScript or Rust
- fewer ergonomic advantages for this specific kind of project

### My view

Viable, but not the strongest option unless you particularly want Go.

---

## Option D: Python

### Strengths

- fastest experimentation
- easy prototyping

### Weaknesses

- weaker long-term structure for a polished real-time terminal action game
- performance and packaging are less attractive for this use case

### My view

Good for toy prototypes, not my recommendation for your stated direction.

---

## Recommended Stack

For your goals, I recommend:

## Primary recommendation: Node.js + TypeScript + custom terminal renderer

Why:

- lowest friction for starting
- enough architectural rigor
- easy to keep code modular
- easy to evolve toward a client/server split later

## Alternative recommendation: Rust if you want a more ambitious systems-oriented build

If your main goal is learning and robustness, Rust is compelling. If your main goal is getting a fun game playable sooner, TypeScript is the better first move.

---

## Suggested High-Level Architecture

Even for single-player, use architecture that separates concerns.

## Core modules

### 1. Simulation

Pure game state updates.

Responsibilities:

- entity updates
- collisions
- AI decisions
- wave progression
- scoring
- cooldowns

This should avoid direct terminal rendering logic.

### 2. Renderer

Converts current game state into a character buffer for terminal output.

Responsibilities:

- composing frame buffer
- colors and glyph selection
- HUD drawing
- effects like hit flash or shake

### 3. Input system

Reads keys and translates them into game commands.

Responsibilities:

- movement intent
- shooting intent
- dash intent
- pause / restart

### 4. Game loop

Controls timing.

Responsibilities:

- fixed or semi-fixed tick updates
- render cadence
- pause handling
- delta timing

### 5. Content definitions

Static definitions for:

- enemy types
- weapons
- upgrades
- waves

### 6. Persistence

Very small layer for:

- high scores
- settings
- unlocked content later if needed

---

## Architecture With Future Multiplayer in Mind

Even if multiplayer is far away, one decision matters now:

## Keep simulation authoritative and decoupled from rendering/input.

That means:

- input becomes commands
- simulation updates state
- renderer only reads state

Later, multiplayer can replace:

- local input source with remote commands
- local state authority with server authority

Without forcing a rewrite of core gameplay logic.

You do **not** need to implement network-aware systems now. Just avoid tightly coupling keyboard input directly into rendering-side behavior.

---

## Suggested Update Model

For an action game in terminal:

- use a fixed simulation tick, for example 20-30 ticks per second
- render as often as practical, possibly same cadence initially

This helps keep collisions and AI deterministic and easier to reason about.

---

## MVP Proposal

If we turn this into an actual build plan later, a good MVP would be:

## MVP name

ASCII Duel: Arena Prototype

## MVP features

- title screen
- one rectangular arena
- player movement
- directional shooting
- dash ability
- 3 enemy types
- wave spawning
- collision and damage
- score counter
- game over screen
- restart loop

## MVP success criteria

The game is successful if, after 2-3 minutes of play:

- movement feels responsive
- combat is readable
- player can enter a flow state
- deaths feel fair enough to retry immediately

That matters more than content volume.

---

## Specific Mechanics I Would Recommend

If you want a "rocking" version rather than just a functional one, these mechanics are strong candidates:

## Best mechanic additions

### Dash-through bonus

If you dash through an enemy projectile at the right time, gain a brief damage bonus or charge.

Why it is good:

- creates hype moments
- rewards skill
- easy to understand once experienced

### Kill streak pressure

Rapid kills build multiplier, but it decays quickly.

Why it is good:

- creates aggression
- makes movement paths more interesting

### Elite showdown waves

Every few rounds, lock the arena and spawn one elite duelist with intro text.

Why it is good:

- reinforces the duel theme
- gives rhythm to runs

### Arena mutators

At certain milestones, add one rule such as:

- moving hazards
- reduced visibility corners
- faster bullets
- enemies explode on death

Why it is good:

- adds variety without huge asset cost

## Best overall combination

For a first serious version, I would combine:

- base shooting
- dash
- streak multiplier
- elite showdown waves
- small upgrade choices between waves

That is enough to make the game feel alive.

---

## Recommended Final Direction

If I were choosing for this project today, I would pick:

## Game

**Single-player top-down ASCII arena shooter with duel-focused elites and short survival runs.**

## Theme

**Rogue Drone Arena** for implementation clarity, or **Neon Gunslinger** if you want stronger flavor.

## Stack

**Node.js + TypeScript + custom ANSI renderer + fixed-tick simulation loop.**

## Design priorities

- responsiveness
- readability
- pressure curve
- replayability
- future-proof simulation architecture

---

## Open Design Decisions

Before implementation, the next useful choices to lock down are:

1. Theme: cyber-western, drones, or abstract arena
2. View style: top-down or side-view
3. Input style: facing-direction shooting or twin-stick keyboard aiming
4. Progression: pure score-chase or between-wave upgrades
5. Tone: minimalist skill game or flashy arcade chaos

---

## Recommended Next Discussion

The best next step is not coding yet. It is to turn this into a sharper mini design spec covering:

1. exact player controls
2. the first 5 enemy types
3. the first boss
4. the upgrade pool
5. the HUD layout
6. the MVP milestone plan

Once those are locked, implementation becomes much more straightforward.