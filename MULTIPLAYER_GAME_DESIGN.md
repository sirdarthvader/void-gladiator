# Multiplayer Game Design — Void Gladiator

> Focus: 2–4 player game modes, arcade-style mechanics, fancy ANSI rendering.
> Scope: Game design only — no networking implementation.

---

## Table of Contents

1. [Player Identity & Visuals](#1-player-identity--visuals)
2. [Game Modes](#2-game-modes)
3. [Shared Multiplayer Mechanics](#3-shared-multiplayer-mechanics)
4. [Arena Hazards & Interactive Elements](#4-arena-hazards--interactive-elements)
5. [Fancy ANSI Rendering Upgrades](#5-fancy-ansi-rendering-upgrades)
6. [HUD & Split-Info Design](#6-hud--split-info-design)
7. [Sound-Equivalent Visual Feedback](#7-sound-equivalent-visual-feedback)
8. [Lobby & Match Flow](#8-lobby--match-flow)
9. [Content Additions for Multiplayer](#9-content-additions-for-multiplayer)
10. [Summary: What to Build First](#10-summary-what-to-build-first)

---

## 1. Player Identity & Visuals

Each player gets a distinct visual identity — crucial for readability in a shared arena.

### Player Glyphs (Unicode, not plain ASCII)

| Slot | Glyph | ANSI Color           | Name Tag |
| ---- | ----- | -------------------- | -------- |
| P1   | `◆`   | Cyan (`\x1b[36m`)    | Cyan     |
| P2   | `◇`   | Magenta (`\x1b[35m`) | Magenta  |
| P3   | `◈`   | Yellow (`\x1b[33m`)  | Gold     |
| P4   | `▣`   | Green (`\x1b[32m`)   | Jade     |

- Each player's projectiles inherit their color
- Player glyph pulses brighter when special is charged (bold + color)
- Dead players render as `✕` in their color (dim) until revived or round ends

### Projectile Glyphs Per Player

| Direction  | Glyph     | Notes                        |
| ---------- | --------- | ---------------------------- | --- |
| Horizontal | `─`       | Unicode box-drawing, not `-` |
| Vertical   | `│`       | Unicode box-drawing, not `   | `   |
| Special    | `═` / `║` | Double-line for Void Lance   |
| Dash trail | `·`       | Dim, fades after 3 ticks     |

---

## 2. Game Modes

### Mode A: Void Storm (Co-op PvE) — 2–4 Players

The natural multiplayer extension of the current wave survival. Players fight together against escalating enemy waves.

**Rules:**

- All players share one arena (60×25 for 3–4 players, 50×25 for 2)
- Waves scale with player count: `base_count × (1 + 0.4 × (players - 1))`
- **Shared life pool**: Team has `3 × player_count` total lives. Any player death costs 1 life. Player respawns after 3 seconds at a random safe spot.
- **Individual upgrades**: Each player picks their own upgrade at upgrade moments. This creates asymmetric builds within the team.
- **Combo scoring**: If two players damage the same enemy within 10 ticks, kills award 1.5× score. Three players = 2×.
- **Revive mechanic**: When a player dies, their ghost (`✕`) remains. Another player can stand on it for 2 seconds to instant-revive (costs no team life).

**Win condition**: Survive as many waves as possible. Team score posted at end.

**Why it's fun**: Coordination, revive clutch moments, asymmetric builds ("I'll go tank, you go DPS"), scaling chaos.

---

### Mode B: Void Duel (FFA PvP) — 2–4 Players

Fast, chaotic free-for-all deathmatch. Pure arcade.

**Rules:**

- Arena: 50×25 (always)
- Each player spawns in their designated corner
- **3 lives per player** (displayed as pips next to their name)
- Last player standing wins the round
- **Best of 5 rounds** (first to 3 round wins)
- Friendly fire is mandatory (it's PvP!)
- **NPC enemies spawn lightly** (1 shardling every 10 seconds) to keep pressure and prevent camping
- **Power-up drops** appear at random arena positions every 15 seconds (see §3)

**Spawn Points:**

```
P1 ──────────────────── P2
│                        │
│         ARENA          │
│                        │
P3 ──────────────────── P4
```

**Win condition**: Last standing wins round. First to 3 rounds wins match.

**Why it's fun**: Quick rounds, trash-talk moments, power-up scrambles, NPC chaos as tiebreaker.

---

### Mode C: Rift Rivals (2v2 Team PvP) — 4 Players

Two teams of two in a divided arena with a twist.

**Rules:**

- Arena split by a **Rift Line** down the center (rendered as `┊` column)
- The Rift Line is semi-permeable: **projectiles pass through, players cannot**
- Every 30 seconds, the Rift **shifts** left or right by 5 columns (announced: `⚡ RIFT SHIFTS LEFT ⚡`)
- Teams can only shoot across the rift — like a deadly volleyball court
- **Each team shares 8 HP total** (no individual health — team health pool)
- Enemies spawn on BOTH sides equally, so you must manage PvE pressure while landing cross-rift shots

**Rift Shift mechanic**: When the rift shifts toward your side, you have less space. This prevents turtling and creates panic moments.

**Win condition**: Reduce opposing team's HP to 0.

**Why it's fun**: Unique "shoot across the divide" mechanic, territory pressure from rift shifts, PvE-meets-PvP tension.

---

### Mode D: Crown Chase (King of the Hill) — 3–4 Players

One player holds the Crown. Everyone else hunts them.

**Rules:**

- A **Crown** (`♛`, gold/yellow, bright) spawns at arena center at match start
- First player to walk over it picks it up — their glyph gains a crown overlay: `♚`
- **The Crown holder scores 1 point per second** they hold it
- Other players can shoot the Crown holder to make them **drop it** (Crown bounces to random nearby cell)
- Crown holder takes **double damage** from all sources
- NPC enemies **only target the Crown holder** — extra pressure on the king
- **No lives** — players respawn after 2 seconds. Dying as Crown holder drops the Crown.
- First to **60 points** (or highest after 3 minutes) wins

**Why it's fun**: Dynamic target-switching, risk/reward of grabbing the crown, "protect me!" moments, constant movement.

---

### Mode E: Boss Rush Co-op — 2–4 Players

Skip the waves. Fight bosses back-to-back with minimal breathers.

**Rules:**

- No regular waves — boss encounters only (The Null Mirror, future bosses)
- Between bosses: 10-second breather + 1 upgrade pick each
- Team shares a life pool of `2 × player_count`
- Bosses scale HP with player count: `base_hp × (1 + 0.5 × (players - 1))`
- **Boss enrage**: If boss fight exceeds 90 seconds, boss enters permanent Phase 3 aggression

**Why it's fun**: Pure skill check, intense coordination, short high-tension sessions.

---

## 3. Shared Multiplayer Mechanics

### Power-Up Drops

Items that appear in the arena and any player can pick up by walking over them.

| Glyph | Name          | Color           | Effect                                                | Duration   |
| ----- | ------------- | --------------- | ----------------------------------------------------- | ---------- |
| `♥`   | Heal Pack     | Red (bright)    | Restore 2 HP                                          | Instant    |
| `⚡`  | Rapid Fire    | Yellow (bright) | Fire cooldown halved                                  | 8 seconds  |
| `✦`   | Shield Orb    | White (bright)  | Absorb next 2 hits                                    | 15 seconds |
| `▲`   | Speed Boost   | Green (bright)  | Move 2× speed                                         | 6 seconds  |
| `☢`   | Void Bomb     | Magenta         | AoE blast (3-cell radius) damages all enemies/players | Instant    |
| `◉`   | Piercing Shot | Cyan            | Projectiles pierce through enemies (not walls)        | 10 seconds |

**Drop rules:**

- PvE modes: Drop from elite enemies or timed spawns every 20 seconds
- PvP modes: Spawn at random positions every 15 seconds (max 2 on field)
- Power-ups blink (render every other tick) for last 3 seconds before despawn
- Despawn after 10 seconds if not collected

### Dash (Implement for All Modes)

The dash command already exists in protocol. Design:

- **Distance**: 4 cells in facing direction
- **Duration**: Instant (teleport-style, not animated slide)
- **Invulnerability**: 5 ticks during/after dash
- **Cooldown**: 45 ticks (1.5 seconds)
- **Trail**: Leave `·` (dim, player color) along dash path, fades after 6 ticks
- **Collision**: Dash stops at arena walls (no wrapping)
- **Kinetic Wake upgrade**: Enemies within 1 cell of dash path take 1 damage

### Special — Void Lance (Implement for All Modes)

- **Charge meter**: Fills 1% per tick passively, +5% per enemy kill, +3% per hit landed
- **Cost**: 100% charge
- **Effect**: Piercing line in facing direction — damages ALL enemies/players in that line
- **Glyph**: `═══════` (horizontal) or column of `║` (vertical), rendered in player color (bright + bold)
- **Damage**: 3 to enemies, 2 to players (PvP balance)
- **Duration**: Visible for 4 ticks (visual impact), damage on first tick only
- **Screen shake**: 2-tick visual jitter on all players' screens when fired (see §7)

### Streak System (All Modes)

- Kill multiplier starts at 1×
- Each kill within 60 ticks of the last: multiplier += 0.5 (cap at 5×)
- Taking damage: multiplier resets to 1×
- Multiplier affects score only (not damage)
- **Visual**: Multiplier shown next to score. At 3×+, player glyph renders with background highlight

---

## 4. Arena Hazards & Interactive Elements

### Void Rifts (PvE modes, waves 4+)

- Rendered as `░` cells (dim magenta)
- 3×1 or 1×3 strips that appear at random positions
- Walking through deals 1 damage per second
- Projectiles pass through normally
- Shift position every 20 seconds
- **Announced**: `░ VOID RIFTS SHIFT ░`

### Bounce Walls (All modes)

- Rendered as `█` (bright white)
- 1×3 or 3×1 blocks placed at 2–3 positions in arena
- Projectiles **reflect** off them (reverse direction)
- Players and enemies cannot pass through
- In PvP: enables trick shots and cover play
- **Positions randomized each round** (in PvP) or each wave set (in PvE)

### Charge Pads

- Rendered as `▓` (bright cyan, pulsing)
- Standing on one for 1 second fully charges your Special meter
- Only appears in waves 5+ or PvP after 30 seconds
- Disappears after one use, respawns elsewhere after 20 seconds

### Arena Shrink (PvP modes, optional)

- After 90 seconds in a PvP round, the arena border starts closing in
- Border advances 1 column/row every 10 seconds
- Boundary cells become `▒` (red) — instant 1 damage on contact
- Forces engagement, prevents turtling
- **Announced**: `▒ VOID CLOSES IN ▒`

---

## 5. Fancy ANSI Rendering Upgrades

### Arena Border — Box-Drawing Characters

Replace the current `+--+` / `|  |` border with proper Unicode box-drawing:

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║                  GAME ARENA                      ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

Characters: `╔ ═ ╗ ║ ╚ ╝` — gives a clean, modern terminal look.

### Entity Rendering Upgrade

| Entity              | Current | Upgraded       | ANSI Treatment                                    |
| ------------------- | ------- | -------------- | ------------------------------------------------- | -------------------- |
| Player              | `@`     | `◆◇◈▣`         | Bold + color + optional bg highlight              |
| Player (invincible) | dim `@` | Blinking glyph | Rapid toggle visible/invisible (2-tick)           |
| Player (dead)       | —       | `✕`            | Dim + player color                                |
| Shardling           | `s`     | `◊`            | Red, wobble (alternate `◊` and `◇` every 4 ticks) |
| Needle              | —       | `▸`            | Red, rotates glyph based on facing                |
| Arc Warden          | —       | `✳`            | Magenta, static but pulses brightness             |
| Rift Hound          | —       | `⋗`            | Yellow, flashes bright during wind-up             |
| Glass Duelist       | —       | `⬡`            | White + bold, the "mini-boss" feel                |
| Boss (Null Mirror)  | —       | `◈` (large)    | Bright white + bg, occupies 3×3 visually          |
| Player projectile   | `-`/`   | `              | `─`/`│`                                           | Player color, bright |
| Enemy projectile    | —       | `•`            | Red, dim                                          |
| Void Lance          | —       | `═`/`║`        | Player color, bold + bright, 4-tick persist       |
| Explosion           | —       | `✦✧·`          | Expand outward over 3 ticks, then fade            |
| Power-up            | —       | See §3 table   | Bright + blink (last 3s)                          |

### Particle Effects (Pseudo-Particles via Character Scatter)

Since we're in a terminal, "particles" are brief character appearances:

**Hit Spark**: When a projectile hits an enemy:

- Tick 0: `✦` at impact point (bright yellow)
- Tick 1: `✧` at impact + 1 adjacent cell (dim yellow)
- Tick 2: `·` scattered in 2-cell radius (very dim)
- Tick 3: Gone

**Death Burst**: When an enemy dies:

- Tick 0: Enemy glyph replaced with `✸` (bright)
- Tick 1: `✦` + `✧` in cardinal directions
- Tick 2: `·` scattered 2-cell radius
- Tick 3: `·` in 3-cell radius (very dim)
- Tick 4: Gone

**Dash Trail**:

- Leave `·` at each cell along dash path in player color (dim)
- Fade over 6 ticks

**Void Lance Fire**:

- Full line of `═` or `║` appears (bold, bright, player color)
- Tick 1: Full brightness
- Tick 2: Dim
- Tick 3: Very dim (`─` or `│`)
- Tick 4: Gone

**Wave Announcement Flash**:

- Center of arena: `═══ WAVE 5 ═══` in bright yellow
- Holds 60 ticks (2 seconds)
- Pulses between bright and dim every 10 ticks

### Color Palette Expansion

```
Background highlights (for status effects):
  \x1b[46m  — Cyan background (shielded player)
  \x1b[41m  — Red background (taking damage flash, 2 ticks)
  \x1b[43m  — Yellow background (streak 3×+)
  \x1b[45m  — Magenta background (standing in void rift)

256-color mode (most modern terminals support this):
  \x1b[38;5;208m  — Orange (fire effects)
  \x1b[38;5;51m   — Bright cyan (charge pads)
  \x1b[38;5;196m  — Bright red (critical health)
  \x1b[38;5;46m   — Neon green (speed boost active)
  \x1b[38;5;201m  — Hot pink (void bomb blast)

Bold + Dim combinations for depth:
  \x1b[1m   — Bold (foreground entities)
  \x1b[2m   — Dim (background elements, trails)
  \x1b[4m   — Underline (charge pads, interactables)
  \x1b[5m   — Blink (use sparingly — power-up despawn warning)
  \x1b[7m   — Reverse video (boss highlight)
```

### Screen Shake Simulation

When big events happen (Void Lance, boss phase change, bomb), simulate screen shake:

**Technique**: Offset the entire rendered frame by 1 character left/right or insert/remove 1 leading space on alternating lines:

- Tick 0: Normal
- Tick 1: Shift all lines +1 space
- Tick 2: Shift all lines -1 space (or no offset)
- Tick 3: Normal

This is cheap and effective in terminal rendering.

### Freeze Frame

On significant moments (final boss hit, round-winning kill in PvP):

- Hold the current frame for 6 extra ticks (200ms pause)
- Flash the screen (invert colors for 2 ticks: `\x1b[7m` on entire frame)
- Resume normal

---

## 6. HUD & Split-Info Design

### Multiplayer HUD Layout (Top)

```
╔══════════════════════════════════════════════════════════════════╗
║ VOID GLADIATOR  │ Wave 5  │ ◆ P1:♥♥♥♡♡ 2450  ◇ P2:♥♥♡♡♡ 1830 ║
╠══════════════════════════════════════════════════════════════════╣
```

For 4 players (compact):

```
◆3♥ 2.4k  ◇2♥ 1.8k  ◈5♥ 3.1k  ▣1♥ 0.9k   Wave 7  Team:12.2k
```

### Bottom Status Bar

```
║ ◆ DASH:▓▓▓░░ SPC:▓▓▓▓▓▓▓░░░ ×2.5  │  ═══ ELITE WAVE ═══     ║
╚══════════════════════════════════════════════════════════════════╝
```

**Elements:**

- **Dash cooldown**: Fill bar `▓░` (5 segments, fills as cooldown recovers)
- **Special charge**: Fill bar `▓░` (10 segments)
- **Streak multiplier**: `×1.0` → `×5.0`
- **Announcements**: Center-justified, bright, time-limited

### Kill Feed (PvP Modes)

Bottom-right corner, last 3 events:

```
◆ eliminated ◇
◈ picked up ♛
▣ → ×3 streak!
```

Fades after 4 seconds (render dim, then remove).

---

## 7. Sound-Equivalent Visual Feedback

Since there's no audio, visual feedback must be STRONG:

| Event                   | Visual Feedback                                            |
| ----------------------- | ---------------------------------------------------------- |
| Player hit              | Red background flash (2 ticks), health bar blinks          |
| Enemy killed            | Death burst particles (4 ticks)                            |
| Projectile fired        | Projectile glyph appears with brief bright flash at origin |
| Dash used               | Trail + brief invincibility glow                           |
| Void Lance fired        | Full-line render + screen shake (3 ticks)                  |
| Power-up collected      | Collecting player's glyph flashes bright (4 ticks)         |
| Wave cleared            | All enemies burst → center announcement → 2s breather      |
| Boss phase change       | Screen shake + flash + boss glyph changes                  |
| Player eliminated (PvP) | Explosion burst at death location + kill feed entry        |
| Crown picked up         | `♛` bounce animation (3 positions over 6 ticks)            |
| Arena shrink            | Red `▒` cells pulse bright/dim at boundary                 |
| Streak milestone (3×+)  | Player gets background highlight                           |
| Game over               | Screen fills with `░` from edges inward over 30 ticks      |

---

## 8. Lobby & Match Flow

### Pre-Game Lobby Screen

```
╔══════════════════════════════════════════════════╗
║             V O I D   G L A D I A T O R         ║
║                                                  ║
║   ◆ Player 1 .............. READY                ║
║   ◇ Player 2 .............. READY                ║
║   ◈ Player 3 .............. waiting              ║
║   ▣ (empty)                                      ║
║                                                  ║
║   Mode: [VOID STORM]  ← →  to change            ║
║                                                  ║
║   Modes: Void Storm │ Void Duel │ Rift Rivals    ║
║          Crown Chase │ Boss Rush                  ║
║                                                  ║
║   Press SPACE when ready  │  Host: press ENTER   ║
╚══════════════════════════════════════════════════╝
```

**Flow:**

1. Host starts game → lobby screen appears
2. Clients join → appear in player slots
3. Host selects game mode (arrow keys)
4. Each player presses SPACE to toggle ready
5. When all ready, host presses ENTER → countdown: `3... 2... 1... FIGHT!`

### Between Rounds (PvP)

```
╔══════════════════════════════════════════════════╗
║               R O U N D   O V E R               ║
║                                                  ║
║   ◆ Player 1 ── ██████░░░░ ── 2 wins            ║
║   ◇ Player 2 ── ████░░░░░░ ── 1 win             ║
║   ◈ Player 3 ── ██░░░░░░░░ ── 0 wins            ║
║                                                  ║
║            Next round in 5...                    ║
╚══════════════════════════════════════════════════╝
```

### Post-Match Summary

```
╔══════════════════════════════════════════════════╗
║            M A T C H   C O M P L E T E          ║
║                                                  ║
║   🏆 WINNER: ◆ Player 1                          ║
║                                                  ║
║   ◆ P1:  3024 pts │ 47 kills │ 4× best streak   ║
║   ◇ P2:  2811 pts │ 39 kills │ 3× best streak   ║
║   ◈ P3:  1205 pts │ 22 kills │ 2× best streak   ║
║                                                  ║
║   MVP Kill: ◆ Void Lance triple kill at Wave 7   ║
║                                                  ║
║   Press R to rematch │ Q to quit                  ║
╚══════════════════════════════════════════════════╝
```

---

## 9. Content Additions for Multiplayer

### New Enemy Behaviors for Multiplayer

Enemies need to handle multiple players:

**Target Selection**: Enemies pick their target based on type:

- **Shardling**: Targets nearest player
- **Needle**: Targets player with highest score (threat-based)
- **Arc Warden**: Area denial — no specific target, fires patterns
- **Rift Hound**: Targets player who last damaged it (aggro)
- **Glass Duelist**: Targets player with lowest health (predatory)

### Multiplayer-Specific Upgrades

| Name           | Effect                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| Void Link      | Co-op: Share 20% of your healing with nearest ally                         |
| Taunt Field    | Draw all enemies toward you for 5 seconds (tank utility)                   |
| Split Dash     | Dash leaves a decoy that attracts enemies for 3 seconds                    |
| Resonance      | Co-op: When you and an ally fire within 2 ticks, both get +1 damage for 5s |
| Vampiric Bolts | 10% chance to heal 1 HP on kill (PvE)                                      |
| Phase Armor    | PvP: First hit each round deals 0 damage                                   |
| Overdrive      | At 1 HP: fire rate doubles, move speed +50% (glass cannon)                 |

### Arena Variants

| Name           | Size  | Features                          | Best For       |
| -------------- | ----- | --------------------------------- | -------------- |
| The Pit        | 50×25 | No hazards, pure combat           | Void Duel      |
| Shattered Hall | 60×25 | 4 bounce walls, 2 void rifts      | Void Storm     |
| The Divide     | 60×25 | Central rift line                 | Rift Rivals    |
| Crown Court    | 50×20 | Open center, obstacles at edges   | Crown Chase    |
| Mirror Chamber | 50×25 | Bounce walls on all 4 sides       | Boss Rush      |
| The Gauntlet   | 70×20 | Long narrow arena, rifts on sides | Co-op survival |

---

## 10. Summary: What to Build First

### Phase 1: Core Enhancements (Single + Multi foundation)

These benefit single-player NOW and are required for all multiplayer modes:

1. **Implement Dash** — Already in protocol, just needs simulation logic
2. **Implement Void Lance (Special)** — Charge meter + piercing line attack
3. **Implement Streak System** — Score multiplier on rapid kills
4. **Upgrade the renderer** — Unicode box-drawing borders, upgraded entity glyphs, hit/death particles
5. **Implement remaining 4 enemy types** — Needle, Arc Warden, Rift Hound, Glass Duelist
6. **Implement wave system** — Wave progression, upgrade selection screen, escalation
7. **Power-up drops** — Item spawning, pickup, timed effects

### Phase 2: Multiplayer Game State

Extend `GameState` to support multiple players:

8. **Multi-player state** — `players: PlayerState[]` instead of single `player`
9. **Player spawn system** — Corner spawns, respawn logic
10. **Target selection AI** — Enemies choose targets from multiple players
11. **Friendly fire / team damage** — Configurable per mode

### Phase 3: Game Modes

12. **Void Storm** (Co-op PvE) — Easiest mode, most code reuse from single-player
13. **Void Duel** (FFA PvP) — Player-vs-player collision, round system
14. **Crown Chase** — Crown entity, holder tracking, point accumulation
15. **Rift Rivals** (2v2) — Rift line rendering and physics
16. **Boss Rush** — Boss implementation + sequential encounter flow

### Phase 4: Polish

17. **Lobby screen & match flow**
18. **Post-match summary & stats**
19. **Screen shake & freeze frame**
20. **Arena variants**
21. **Kill feed (PvP)**
