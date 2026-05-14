# Void Gladiator Competitive Analysis Report

Date: 2026-05-13

## Executive Verdict

Void Gladiator has a strong concept and a sane technical spine, but the project is currently much more convincing as an architecture exercise than as a game.

The best idea in the current docs is the hybrid identity: a terminal-native, real-time ASCII arena shooter with survival-run escalation and periodic duel-style elite encounters. That is meaningfully different from the crowded survivor-like field because it is not trying to out-content Vampire Survivors or out-smooth Enter the Gungeon. Its path is narrower: readable ASCII combat, short runs, deliberate dash/special timing, and stylish elite duels.

The hard truth: the current implementation does not yet prove that identity. It proves that the package split works, the fixed-tick simulation can update, and basic combat primitives can be tested. It does not yet prove fun, tension, replayability, game feel, or the multiplayer future.

## Sources Reviewed

Local repo docs:

- [README.md](README.md)
- [VOID_GLADIATOR_SPEC.md](VOID_GLADIATOR_SPEC.md)
- [GAME_DESIGN.md](GAME_DESIGN.md)
- [TECH_ARCHITECTURE.md](TECH_ARCHITECTURE.md)
- [MONOREPO_ARCHITECTURE.md](MONOREPO_ARCHITECTURE.md)
- [MULTIPLAYER_ARCHITECTURE.md](MULTIPLAYER_ARCHITECTURE.md)

Local implementation:

- `apps/cli-game`
- `packages/game-core`
- `packages/engine-loop`
- `packages/renderer-ansi`
- `packages/terminal-input`
- `packages/content`
- `packages/persistence`
- `packages/protocol`
- `packages/network-lan`
- `tests/integration`

External competitive references:

- [Vampire Survivors on Steam](https://store.steampowered.com/app/1794680/Vampire_Survivors/)
- [Brotato on Steam](https://store.steampowered.com/app/1942280/Brotato/)
- [20 Minutes Till Dawn on Steam](https://store.steampowered.com/app/1966900/20_Minutes_Till_Dawn/)
- [Nuclear Throne on Steam](https://store.steampowered.com/app/242680/Nuclear_Throne/)
- [Enter the Gungeon on Steam](https://store.steampowered.com/app/311690/Enter_the_Gungeon/)
- [Cogmind on Steam](https://store.steampowered.com/app/722730/Cogmind/)
- [Jupiter Hell on Steam](https://store.steampowered.com/app/811320/Jupiter_Hell/)
- [Brogue Community Edition Wiki](https://brogue.wiki/)
- [Cataclysm: Dark Days Ahead official site](https://cataclysmdda.org/)
- [NetHack official site](https://www.nethack.org/)

## What Has Actually Been Done

The repo has a credible scaffold:

- pnpm workspace plus Nx configuration.
- One runnable CLI app shell.
- Internal package boundaries for game core, loop, ANSI renderer, terminal input, content, persistence, protocol, shared utilities, and LAN placeholder.
- A command-driven game-core API.
- Fixed 30 Hz ticker.
- Terminal input mapping for movement, fire, dash, special, and quit.
- Basic arena render with ANSI colors.
- Player state with position, facing, health, fire cooldown, and invincibility ticks.
- Projectiles with movement, lifetime, bounds removal, and owner.
- One enemy type: Shardling.
- Simple Shardling movement toward the player.
- Player projectile versus enemy collision.
- Enemy contact damage and game-over flag.
- Sandbox auto-spawn.
- Basic integration tests for movement, firing, spawning, collision, damage, invincibility, game over, and tick progression.

Validation results:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 2 files and 23 tests.
- `VOID_GLADIATOR_ONCE=1 pnpm exec tsx apps/cli-game/src/main.ts`: passed only with escalated permissions in this sandbox because `tsx` needs to create an IPC socket.
- `pnpm dev`: blocked in this sandbox by Nx/tsx socket permission behavior, not by TypeScript errors. In a normal terminal this may be fine, but the repo should still document `NX_DAEMON=false` or direct `tsx` fallback if the daemon causes trouble.

## Milestone Reality Check

The project is at "Milestone 1 done, Milestone 2 partial."

Done:

- Project scaffold.
- Main loop.
- Basic terminal render.
- Player movement.
- Primary fire.
- Projectiles.
- Basic collision.
- Shardling spawn and AI.
- Damage and game over flag.

Partial or missing:

- Needle enemy: missing.
- Real waves: missing. Current auto-spawn is a sandbox timer, not wave progression.
- Score: missing, despite `scoreValue` existing in content.
- Streak multiplier: missing.
- Dash: command exists, implementation missing.
- Void Lance special: command exists, implementation missing.
- Upgrades: missing.
- Elite showdown: missing.
- Boss: missing.
- Title scene: missing.
- Pause and restart flow: missing.
- Persistent high score: placeholder only.
- Renderer buffer/diffing: missing.
- Terminal resize handling: missing.
- Input held-state model: missing.
- LAN networking: placeholder only.

The docs are ahead of the code, which is normal early. The issue is that some docs claim or imply more confidence than the implementation deserves.

## Competitive Landscape

Void Gladiator is competing against three categories, not one.

### 1. Survivor-like arena games

Relevant examples: Vampire Survivors, Brotato, 20 Minutes Till Dawn.

What they teach:

- The core loop has to snowball quickly.
- Upgrade choices must visibly change the run.
- Enemy density and pacing are the product.
- Runs need immediate "one more try" pressure.
- Content breadth matters, but only after the base loop is addictive.

Void Gladiator alignment:

- The docs correctly choose short survival runs, wave escalation, upgrade choices, score pressure, and boss/elite spikes.
- The "every 2 waves choose 1 of 3 upgrades" rule is a good structural fit.
- The streak system is the right kind of lightweight score-chasing hook.

Void Gladiator gap:

- Current code has no waves, no score, no upgrades, and no build texture. Against this category, the product is not competitive yet.
- The current fire model is too plain to carry replayability. A straight projectile plus one chaser enemy is a test harness, not a game.

### 2. Top-down action roguelites and bullet-hell shooters

Relevant examples: Nuclear Throne, Enter the Gungeon.

What they teach:

- Game feel is king: movement, firing cadence, dodge/dash timing, hit feedback, and readable death causes.
- Enemy roles must create different movement decisions.
- Bosses and elites need signature attacks, not just higher stats.
- A small roster can work if each enemy changes the player's behavior.

Void Gladiator alignment:

- The docs emphasize readability, tight action, dash timing, elite duels, and pressure rhythm. That is the right instinct.
- The enemy roster is role-based rather than stat-based: chaser, ranged line shooter, space controller, lunge attacker, elite rival.

Void Gladiator gap:

- Dash is central in the docs but absent in code.
- There is no hit flash, freeze, shake, projectile pattern language, or death explanation yet.
- Enemy movement is currently biased and basic; it does not yet create interesting choices.
- Projectile speed 2 plus exact-cell collision creates tunneling risk. A projectile can skip over an enemy between cells unless alignment happens to match.

### 3. ASCII and terminal-native games

Relevant examples: Cogmind, Brogue, Cataclysm: Dark Days Ahead, NetHack, Jupiter Hell as a modern roguelike shooter-adjacent comparison.

What they teach:

- ASCII can be a strength only if readability and feedback are exceptional.
- Minimal graphics do not excuse thin systems.
- Terminal/ASCII audiences tolerate abstraction, but they expect clarity, keyboard ergonomics, tactical legibility, and surprising depth.
- Mature ASCII games win through interface craft, simulation depth, replayability, or all three.

Void Gladiator alignment:

- The docs understand that color, glyph hierarchy, and low-noise messaging matter.
- A compact 50-column arena can be a strength if enemy patterns are tuned for terminal readability.

Void Gladiator gap:

- The renderer is a simple string builder, not a terminal UI system yet.
- No frame buffer, no diffing, no alternate screen, no resize policy, no crash-safe terminal recovery.
- HUD is too thin for the promised game: no wave, score, multiplier, dash status, special meter, or message lane.
- The arena height in code is 20, while the spec targets around 50 x 25.

## Strategic Positioning

The strongest positioning is:

> A fast, terminal-native arena shooter where every glyph matters, every dash is a decision, and survival runs periodically collapse into readable one-on-one ASCII duels.

That is sharper than "Vampire Survivors in a terminal." Do not chase thousands of enemies. Do not chase huge upgrade catalogs early. Do not chase multiplayer before the single-player loop bites.

The strongest differentiators to protect:

- Terminal-native action, not a TUI novelty.
- Readable ASCII bullet patterns.
- Duel-style elite encounters inside survival pacing.
- High skill ceiling from facing, dash, lance alignment, and score streaks.
- LAN multiplayer later as a delightful niche feature, not the main pitch.

## Documentation Assessment

### What is strong

The docs are unusually coherent for an early solo game project:

- The design pillars are clear.
- The MVP scope is mostly disciplined.
- Package boundaries are sensible.
- The technical architecture correctly protects game-core from terminal-specific APIs.
- Command-driven simulation is the correct future-proof seam.
- The enemy roster is designed around behavior roles, not just more HP.
- The upgrade list favors visible mechanics instead of tiny stat dust.

### What is weak

There is too much documentation for the amount of game currently implemented.

The risk is not overengineering in code yet. The risk is planning gravity: the docs make multiplayer and architecture feel urgent while the actual product still lacks fun. The project should now shift hard from "designing the machine" to "proving the loop."

Specific doc problems:

- `TECH_ARCHITECTURE.md` and `MONOREPO_ARCHITECTURE.md` contain stale absolute links pointing to `/Users/ashish.singh/Documents/personal/game/test1/...`.
- Docs say design files should move under `docs/`, but they still live at repo root.
- `README.md` does not list `MULTIPLAYER_ARCHITECTURE.md` in the design documents table.
- `MULTIPLAYER_ARCHITECTURE.md` is untracked.
- `GAME_DESIGN.md` is still a brainstorm, while `VOID_GLADIATOR_SPEC.md` is the lock. Keeping both is fine, but the repo needs to make the source-of-truth hierarchy explicit.
- The milestone maps conflict subtly. The spec says the first code pass should aim at Milestone 1, while the tech architecture marks the early engine/combat milestones as complete. That is understandable historically, but confusing for the next contributor.

## Architecture Assessment

The package split is a good call. It is not too much ceremony yet because the packages map to real boundaries:

- `game-core` owns simulation.
- `renderer-ansi` owns projection.
- `terminal-input` owns key normalization.
- `protocol` can become the future network/replay seam.
- `network-lan` is reserved without polluting the game.

But there are problems to fix before the architecture hardens:

- `engine-loop` is too thin to justify the broader responsibilities described in docs. That is fine, but the docs should stop claiming buffer/input/terminal access belong there if those are separate packages.
- `GameState` is not structured into run/world/player/ui/effects domains yet.
- `TickInput` is single-player only and lacks player attribution.
- `spawnEnemy` uses `Math.random`, which undermines deterministic simulation, replays, and authoritative multiplayer.
- `terminal-input` maps raw keypresses to commands but does not track held movement state, despite the docs saying held movement should be stateful.
- `protocol.CommandEnvelope` is incomplete: it has `kind` and `tick`, but no commands, player identity, sequence, schema version, or payload shape.
- `MAX_PLAYERS = 4` exists in content while the spec says future multiplayer target is 2 machines. The multiplayer doc later talks about Player C and up to 16 Citadel clients. That is scope drift.

## Multiplayer Assessment

The multiplayer doc is useful as a thought experiment, but it is too confident.

Good:

- Host-authoritative simulation is the right model.
- Treating Citadel as an opaque relay keeps game logic in TypeScript.
- Full-state snapshots at 30 Hz are reasonable for LAN if state stays small.
- Keeping single-player as the default path is correct.

Relentless critique:

- The document says single-player needs zero changes, but multiplayer absolutely requires game-core changes. The current `GameState` has one `player`, not `players`.
- The document says game-core can remain unchanged, then admits `players: PlayerState[]` is needed. That is not minimal. It changes commands, collisions, HUD, spawn safety, death rules, scoring, and possibly camera/layout.
- The command merger examples show merged commands but the current command model cannot distinguish which player issued which command.
- TCP is acceptable on LAN, but the doc underplays jitter, backpressure, delayed packets, disconnect semantics, and host/client version mismatches.
- "No rollback or prediction needed" is probably true for a casual LAN prototype, but it should be stated as a product tradeoff, not a law.
- The Citadel dependency is not verified in this repo. The public GitHub link in the doc could not be confirmed through search/open during this review, so all claims about Citadel behavior should be treated as assumptions until the binary/API is tested locally.
- Multiplayer should not be implemented until single-player has dash, special, scoring, waves, and at least three enemy roles. Networking a boring game only creates a synchronized boring game.

## Gameplay Assessment

The current game does not yet have enough verbs or pressure to be fun.

Most urgent gameplay gaps:

- Dash is missing, but dash is one of the pillars of the combat fantasy.
- Special shot is missing, but the Void Lance is the clearest differentiator in ASCII.
- Score is missing, but the docs correctly identify score as replayability.
- Waves are missing, so there is no rhythm.
- Only one enemy exists, so there is no tactical read.
- No upgrade choices exist, so runs cannot diverge.
- No feedback events exist, so hits and death lack drama.

The first fun target should not be "finish MVP." It should be:

> A 3-wave playable loop where the player can dash, line up a Void Lance, kill Shardlings and Needles, see score/streak feedback, and die in a way that feels fair.

That is the moment the game becomes judgeable.

## Highest-Risk Technical Issues

1. Projectile tunneling.

Projectile speed is 2 cells per tick and collision checks exact final positions. This can skip enemies. Use swept collision along the segment, reduce projectile speed to 1, or represent projectile movement as substeps.

2. Non-deterministic spawn randomness.

`Math.random` inside `spawnEnemy` makes future replays and host/client verification harder. Introduce a seedable RNG in game state before waves and multiplayer.

3. Input model mismatch.

The docs promise held movement. The code emits discrete movement commands from keypress events. Terminal key repeat is not a proper input-state model. Add `InputState` or command start/stop events before tuning movement feel.

4. Single-player state shape blocks multiplayer.

The current state is clean for single-player but not multiplayer-ready in the way the multiplayer doc claims. If LAN remains a real goal, introduce player IDs and a player collection behind a single-player-compatible helper before too much logic assumes `state.player`.

5. Renderer is too primitive for action readability.

Full redraw is acceptable now, but the renderer needs a buffer abstraction soon because effects, HUD clarity, damage flashes, and resize behavior will become painful as string concatenation grows.

6. Docs overstate done-ness.

The project can pass tests while still missing the product. Milestone language should be made brutally factual.

## Competitive Gap Table

| Area              | Competitor expectation                     | Current Void Gladiator          | Verdict                |
| ----------------- | ------------------------------------------ | ------------------------------- | ---------------------- |
| Core loop         | Repeatable runs with escalation            | Sandbox auto-spawn only         | Not competitive        |
| Game feel         | Dash/dodge, tight firing, readable damage  | Movement/fire/contact only      | Not competitive        |
| Build variety     | Upgrade choices alter play                 | No upgrades                     | Not competitive        |
| Enemy variety     | Distinct roles and patterns                | One chaser                      | Not competitive        |
| ASCII readability | Strong glyph/color language                | Basic render, no effects        | Promising but immature |
| Architecture      | Testable, modular, iteration-friendly      | Good package split, green tests | Competitive strength   |
| Multiplayer       | Clear host/client protocol and state model | Placeholder, contradictory doc  | Premature              |
| Persistence       | High score/replay hooks                    | Path helper and stub load       | Missing                |

## Recommended Next Moves

### Priority 1: Make the single-player loop real

Implement in this order:

1. Score and kill events.
2. Wave state: wave number, enemies remaining, clear transition.
3. Needle enemy with line-shot behavior.
4. Dash with cooldown and invulnerability.
5. Void Lance with charge meter.
6. Streak multiplier and HUD updates.
7. Title/game-over/restart scene flow.

Do not touch LAN until this is playable.

### Priority 2: Fix simulation correctness before more content

- Replace `Math.random` with seedable RNG in game state.
- Fix projectile tunneling.
- Add event output from `tickGameState` or transient effects in state.
- Add player command attribution if multiplayer is still desired.
- Add tests for waves, score, dash cooldown, lance hits, and deterministic spawns.

### Priority 3: Make the terminal presentation earn the concept

- Add wave/score/multiplier/dash/special to HUD.
- Add short event messages: `WAVE 2`, `LANCE READY`, `STREAK LOST`.
- Add hit flash and death flash.
- Add alternate screen and robust terminal cleanup.
- Add resize guard.
- Move toward a frame buffer once effects begin to accumulate.

### Priority 4: Clean the docs

- Move docs into `docs/` or remove the stale instruction saying they should move.
- Add `MULTIPLAYER_ARCHITECTURE.md` to README if it is meant to exist.
- Track or discard `MULTIPLAYER_ARCHITECTURE.md`; do not leave it untracked.
- Fix stale absolute links.
- Add a `CURRENT_STATUS.md` or update README with a truthful status table.
- Mark multiplayer as "future, blocked by single-player state model and fun validation."

## Final Call

Void Gladiator has a viable wedge, but the wedge is not "terminal Vampire Survivors" and it is definitely not "multiplayer architecture." The wedge is a fast, readable, severe little ASCII combat game where the player survives waves and then gets forced into tense duels.

The architecture is good enough. The docs are good enough. The next work should be ruthless: prove the 60-second loop. If that loop is not fun with two enemies, dash, lance, score, and waves, no amount of monorepo cleanliness or LAN planning will save it.
