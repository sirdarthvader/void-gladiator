# Void Gladiator - Finalized Design Spec

## Status

This document locks the first implementation direction for the game.

It is the handoff from brainstorming into building.

---

## Locked Decisions

## Game identity

- Name: **Void Gladiator**
- Genre: real-time ASCII arena shooter
- Perspective: top-down
- Mode: single-player only for phase 1
- Session style: short survival runs with escalating waves
- Tone: minimalist, stylish, high-pressure arcade combat

## Tech direction

- Runtime: Node.js
- Language: TypeScript
- Rendering: custom terminal renderer using ANSI escape sequences
- Simulation: fixed-tick game loop
- State model: simulation decoupled from rendering and input

## Future multiplayer direction

- Multiplayer is not part of the first playable version
- Future multiplayer target is **2 machines on the same local network**
- Either machine can host the match and become the authoritative server
- The non-host machine connects as a client and sends player commands
- The host owns game state, collision resolution, scoring, and match progression

This decision affects architecture now, even though networking will be added later.

---

## Core Vision

Void Gladiator is a fast top-down ASCII arena game about surviving ritual combat inside the void.

The player is a lone gladiator represented by a sharp, readable glyph inside a compact arena full of geometric enemies, projectile patterns, and periodic elite duels. The game should feel tense, clean, and highly replayable.

The experience should emphasize:

- clarity over noise
- skill over complexity
- short but intense runs
- dramatic recoveries
- duel-style elite encounters inside a broader survival structure

---

## Design Pillars

## 1. Readability

At any moment, the player must instantly parse:

- where they are
- where danger is
- which enemy matters most
- whether their dash or special is available

## 2. Tight action

Movement, shooting, and dash timing must create the fun. Depth should come from positioning and pressure rather than many systems.

## 3. Strong arena rhythm

Runs should alternate between:

- setup
- pressure
- panic
- recovery
- showdown

## 4. Expressive minimalism

The game should feel stylish using simple glyphs, color, motion, and timing rather than elaborate presentation.

## 5. Future-safe simulation

The simulation should be built as if it could later run on a host machine without caring whether input came from a local keyboard or from a network client.

---

## Final Game Loop

1. Spawn into the arena.
2. Fight a wave of enemies.
3. Clear the wave and receive a score bonus.
4. Every 2 waves, choose 1 upgrade from 3 options.
5. Every 5 waves, face an elite showdown wave.
6. Continue until death.
7. Record score and highest wave reached.
8. Return to title screen or restart immediately.

This gives the game a simple but strong rhythm with frequent rewards and visible escalation.

---

## Player Kit

The first version should keep the player moveset small and polished.

## Actions

- move
- fire primary shot
- dash
- use special shot

## Final control model for MVP

- `WASD`: movement
- `Space`: fire primary weapon in current facing direction
- `K`: dash
- `J`: special shot
- `P`: pause
- `R`: restart after death
- `Q`: quit to title or exit

## Facing rule

The player faces the last movement direction.

Why this is the right MVP choice:

- low input complexity
- easier to learn in terminal form
- simpler to implement and tune
- keeps focus on movement, timing, and spatial control

Twin-stick keyboard aiming can be explored later if the first version feels too limited.

## Base stats

- health: 5
- primary fire cooldown: moderate
- dash cooldown: short but meaningful
- special charge: fills passively and slightly faster through aggressive play
- score: always visible
- streak multiplier: visible but lightweight

---

## Combat Model

## Primary weapon

The starting weapon is the **Void Bolt**.

Behavior:

- straight projectile
- moderate speed
- reliable cadence
- no ammo system

The player does not swap weapons in the MVP. Instead, upgrades modify the base weapon.

## Dash

Dash is a short burst of movement with a brief invulnerability window.

Design goals:

- escape bullet lines
- cross danger zones
- create hype recovery moments
- reward timing rather than spam

## Special shot

The special is the **Void Lance**.

Behavior:

- piercing line attack in facing direction
- high damage
- narrow hit profile
- limited by a charge meter

Why this is the right special:

- very readable in ASCII
- high skill ceiling
- satisfying against aligned enemies and elites
- visually distinct without needing complex animation

## Streak system

Rapid kills build a score multiplier.

Rules:

- killing enemies extends the streak timer
- taking too long drops the multiplier
- getting hit reduces the multiplier sharply

Purpose:

- encourages aggressive movement
- adds score-chasing depth
- makes route choice matter without adding heavy systems

---

## Arena Rules

## Arena size

Target the MVP around **50 columns x 25 rows** for the active battlefield.

This is large enough for dodging and small enough for constant combat pressure.

## Arena structure

The initial arena is a single rectangular battlefield with a clean border.

No procedural map generation in phase 1.

## Environmental hazards

Do not start with persistent complex hazards.

The only environment pressure in the MVP should be:

- enemy bullet patterns
- enemy body collision
- occasional temporary hazard tiles during elite waves or boss phases

---

## Enemy Roster

The first release should prioritize behavioral variety over enemy count.

## 1. Shardling

Role:

- basic chaser

Behavior:

- moves toward player directly
- low health
- low damage
- appears in groups

Purpose:

- teaches movement and kiting
- creates pressure during mixed waves

## 2. Needle

Role:

- ranged line shooter

Behavior:

- stops briefly to aim
- fires straight shots
- repositions after shooting

Purpose:

- introduces readable projectile pressure
- forces lateral dodging

## 3. Arc Warden

Role:

- space controller

Behavior:

- slow movement or stationary anchor behavior
- fires small spreads or rotating bursts
- durable compared to basic enemies

Purpose:

- changes safe routes
- creates mid-wave priority targets

## 4. Rift Hound

Role:

- timing check attacker

Behavior:

- brief wind-up
- fast lunge toward last known player position
- vulnerable after the dash

Purpose:

- tests dash timing
- punishes panicked movement

## 5. Glass Duelist

Role:

- elite rival

Behavior:

- strafes with intent
- fires burst patterns
- performs occasional short dodge steps
- has distinct attack phases

Purpose:

- carries the duel fantasy
- anchors showdown waves
- forces player to read and respond, not just kite

---

## First Boss

## Name

**The Null Mirror**

## Fantasy

A ceremonial void champion that reflects the player fantasy back at them.

## Behavior phases

### Phase 1: Measure

- slow strafing
- deliberate straight shots
- readable spacing game

### Phase 2: Reflection Burst

- mirrored burst attacks
- brief reposition dashes
- denser arena pressure

### Phase 3: Fracture

- temporary hazard lines appear in the arena
- boss becomes more aggressive
- punish over-committing and reward precise Void Lance use

## Boss design goals

- feels like a real duel, not just a giant enemy sponge
- readable enough to learn within one or two attempts
- strong tension spike without becoming bullet-hell clutter

---

## Upgrade Pool

The game should use between-wave upgrades rather than permanent progression at the start.

Each upgrade should be easy to understand and strong enough to change play feel.

## Starting MVP pool

### 1. Split Bolt

Primary shots fork into two weaker shards after traveling a short distance.

### 2. Lance Capacitor

Special charge fills faster.

### 3. Phase Step

Dash cooldown reduced slightly.

### 4. Void Burn

Special hits apply a short damage-over-time effect.

### 5. Kinetic Wake

Dashing damages nearby enemies lightly.

### 6. Overfocus

Standing still briefly tightens primary shot recovery and improves cadence.

### 7. Blood Score

Streak timer decays more slowly.

### 8. Edge Guard

Taking damage grants a very short movement boost.

### 9. Piercing Bolt

Primary shots pierce one enemy.

### 10. Fragile Power

Primary shots deal more damage while at full health.

## Upgrade rules

- present 3 choices at a time
- do not offer tiny percentage-only upgrades in the first version
- prefer upgrades that visibly change decision-making

---

## Difficulty Curve

Difficulty should rise through composition, speed, and pattern density rather than only health inflation.

## Escalation model

- early waves teach enemy roles one at a time
- mid waves mix enemy roles to create layered pressure
- elite waves reduce clutter and increase tactical intensity
- boss waves deliver large pattern and tension spikes

## Wave rhythm

- waves 1-2: basic learning pressure
- waves 3-4: mixed enemy combinations
- wave 5: first elite showdown
- waves 6-9: denser combinations and faster shots
- wave 10: boss encounter or major showdown

This rhythm can be tuned later, but the structure should be present early.

---

## Scoring

Score is a major part of replayability.

## Score sources

- enemy kills
- wave clear bonus
- elite kill bonus
- boss clear bonus
- streak multiplier
- no-damage wave bonus

## High score philosophy

The game should support score-chasing from the start.

The first build should save at least:

- highest score
- highest wave reached

---

## HUD Layout

The HUD should be compact and readable.

## Top line

- game title or mode label
- current wave
- score
- multiplier

## Bottom line or side panel

- health
- dash cooldown status
- special charge meter
- short message area for upgrade prompts, elite warnings, and death messages

## Messaging style

Use short, dramatic, low-noise messages such as:

- `WAVE 5 - SHOWDOWN`
- `SPECIAL READY`
- `MULTIPLIER LOST`
- `NULL MIRROR AWAKENS`

---

## Visual Language

Void Gladiator should feel abstract and ceremonial rather than technological.

## Glyph direction

- player: a strong single glyph like `@` or `A`
- basic enemies: lower-case or simple angular glyphs
- elites: distinct capital or doubled glyph look
- player projectiles: bright thin glyphs
- enemy projectiles: dimmer but still visible glyphs
- hazards: patterned glyphs like `~`, `:`, or `x`

## Color direction

Avoid overusing rainbow color.

Preferred palette direction:

- player: bright white or cyan
- enemy fire: amber or red
- elites: magenta or bright yellow
- hazards: red or deep orange
- UI accents: muted cyan and gray

The palette should stay restrained so danger reads clearly.

---

## Audio and Feedback

Audio is optional early, but feedback is not.

The game should use terminal-friendly feedback such as:

- hit flashes
- brief glyph swaps on damage
- subtle arena shake during heavy hits or boss phases
- distinct color pulse when special becomes ready
- short pause or freeze-frame feel on elite death if practical

Even without sound, the game should feel reactive.

---

## MVP Scope

The first playable milestone should include only the minimum needed to prove the game is fun.

## MVP feature list

- title screen
- one fixed arena
- player movement
- facing-direction shooting
- dash
- Void Lance special
- 4 normal enemies
- 1 elite enemy
- wave progression
- 6-10 upgrades in content definitions
- score and streak multiplier
- game over flow
- persistent high score file

## Explicitly out of scope for MVP

- online or LAN play
- local co-op
- procedural arenas
- multiple characters
- inventory
- story mode
- permanent progression systems
- settings UI beyond essentials

---

## Technical Architecture

The implementation should be split into clear modules from the beginning.

## 1. Engine loop

Responsibilities:

- fixed tick timing
- update scheduling
- render scheduling
- pause and restart flow

## 2. Simulation

Responsibilities:

- world state
- entities
- movement and collisions
- damage and death
- wave progression
- upgrade application
- score logic

This layer should be deterministic as much as practical.

## 3. Input layer

Responsibilities:

- map terminal key events into game commands
- separate current input state from simulation state
- eventually support local or remote command sources

## 4. Renderer

Responsibilities:

- maintain frame buffer or back buffer
- draw arena, entities, effects, and HUD
- flush ANSI output efficiently
- minimize flicker and unnecessary redraws

## 5. Content definitions

Responsibilities:

- enemy stats and patterns
- upgrade definitions
- wave templates
- boss configuration

## 6. Persistence

Responsibilities:

- score storage
- lightweight config storage

---

## LAN Multiplayer-Aware Architecture

Even though phase 1 is offline-only, the following rules should be treated as non-negotiable:

## Rule 1

Simulation must not depend directly on terminal input APIs.

It should accept normalized commands such as:

- move up
- move left
- fire pressed
- dash pressed
- special pressed

## Rule 2

Rendering must only read current simulation state.

It should not contain gameplay logic.

## Rule 3

Game state authority belongs to the host.

When LAN mode exists later:

- host runs the authoritative simulation
- client sends input commands
- host sends state snapshots or compact sync messages back

## Rule 4

Transport should be abstracted behind an interface.

The first networking target can be a simple LAN transport using Node TCP sockets with a compact JSON or binary-friendly message format.

The single-player version does not need to implement this transport, but the seams should exist.

## Rule 5

The game should think in terms of commands and snapshots, not direct shared local state.

That will make the transition to 2-machine LAN play much easier.

---

## Suggested Internal Data Flow

For the offline MVP:

1. terminal input produces commands
2. command queue feeds the simulation tick
3. simulation updates authoritative state
4. renderer reads state and draws the frame
5. persistence stores end-of-run results

For future LAN play:

1. local input on each machine produces commands
2. host receives all commands and runs simulation
3. host distributes state updates
4. each machine renders from synchronized state

This is the right architecture boundary to keep now.

---

## Success Criteria

The first playable build is successful if:

- movement feels responsive
- shots are readable
- dash creates clutch save moments
- the player immediately understands why they died
- at least one elite encounter feels memorable
- losing makes the player want one more run

That is more important than having many enemies or upgrades.

---

## Build Plan

## Milestone 1: Combat sandbox

- open terminal renderer
- draw arena
- move player
- fire projectiles
- basic collision

## Milestone 2: First enemy loop

- add Shardling and Needle
- spawn waves
- handle damage and death
- add score

## Milestone 3: Full MVP combat

- add dash
- add Void Lance
- add remaining core enemies
- add streak system

## Milestone 4: Structure and polish

- add upgrades
- add elite showdown wave
- add title and game over screens
- save high score

## Milestone 5: Boss and refinement

- add Null Mirror
- tune wave pacing
- improve feedback and UI clarity

---

## Next Implementation Target

The first code pass should aim at **Milestone 1: Combat sandbox**.

That means the first build task is not networking, content breadth, or menus.

It is:

- stable terminal loop
- clear arena rendering
- responsive player movement
- readable projectile behavior

If those are weak, the rest of the game will not carry.