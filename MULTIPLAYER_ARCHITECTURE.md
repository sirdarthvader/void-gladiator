# Void Gladiator × Citadel — Multiplayer Networking Architecture

> How Void Gladiator uses [Citadel](https://github.com/vipul0092/citadel) (a Go LAN server)
> for real-time multiplayer — without rewriting the game engine.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [What Citadel Already Gives Us](#2-what-citadel-already-gives-us)
3. [Three Modes of Play](#3-three-modes-of-play)
4. [Single-Player (unchanged)](#4-single-player-unchanged)
5. [Host Mode — Full Flow](#5-host-mode--full-flow)
6. [Client Mode — Full Flow](#6-client-mode--full-flow)
7. [Wire Protocol — How Bytes Move](#7-wire-protocol--how-bytes-move)
8. [Game Message Taxonomy](#8-game-message-taxonomy)
9. [Lifecycle — From Launch to Game Over](#9-lifecycle--from-launch-to-game-over)
10. [Package Responsibilities](#10-package-responsibilities)
11. [What Changes, What Doesn't](#11-what-changes-what-doesnt)
12. [FAQ](#12-faq)

---

## 1. The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LAN / Same Machine                               │
│                                                                         │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐   │
│   │  Player A     │         │   Citadel    │         │  Player B     │   │
│   │  (HOST)       │◄──TCP──►│   Server     │◄──TCP──►│  (CLIENT)     │   │
│   │               │         │   (Go bin)   │         │               │   │
│   │  runs game    │         │              │         │  renders game │   │
│   │  simulation   │         │  relays all  │         │  from host    │   │
│   │               │         │  "game" msgs │         │  snapshots    │   │
│   └──────────────┘         └──────────────┘         └──────────────┘   │
│                                    ▲                                     │
│                                    │ TCP                                 │
│                             ┌──────┴──────┐                             │
│                             │  Player C    │                             │
│                             │  (CLIENT)    │                             │
│                             └─────────────┘                             │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key insight:** Citadel is a **relay**. It doesn't understand game logic. It receives
`game` type messages and forwards them to everyone else. The game intelligence stays
entirely in our TypeScript code.

**The host is the authority.** One player runs the simulation. Everyone else sends
commands and renders whatever the host tells them to render.

---

## 2. What Citadel Already Gives Us

Citadel is a compiled Go binary your friend built. Here's what it handles so we don't have to:

```
┌────────────────────────────────────────────────────────────────────┐
│  CITADEL HANDLES (Go binary)           │  WE HANDLE (TypeScript)  │
│────────────────────────────────────────│──────────────────────────│
│  ✓ LAN auto-discovery (mDNS + UDP)    │  ✓ Game simulation       │
│  ✓ TCP connection management           │  ✓ Game commands         │
│  ✓ Length-prefixed JSON framing        │  ✓ State serialization   │
│  ✓ Client registry & name uniqueness   │  ✓ Rendering             │
│  ✓ Heartbeat (ping/pong every 15s)    │  ✓ Player management     │
│  ✓ Chat (bonus — lobby chat!)         │  ✓ Lobby flow            │
│  ✓ Graceful disconnect & kick          │  ✓ Host authority logic  │
│  ✓ Up to 16 simultaneous clients       │  ✓ Spawn citadel process │
└────────────────────────────────────────┴──────────────────────────┘
```

**How players find each other:**

```
  Player B runs:  void-gladiator --join
                       │
                       ▼
            ┌─────────────────────┐
            │  Citadel Discovery  │
            │                     │
            │  1. Localhost probe  │ ◄── instant (same machine)
            │     (300ms)         │
            │                     │
            │  2. UDP broadcast   │ ◄── works even with AP isolation
            │     + mDNS browse   │
            │     (~10s)          │
            │                     │
            │  3. --server flag   │ ◄── manual fallback (VPN, etc)
            │     (always works)  │
            └─────────────────────┘
                       │
                       ▼
              Found host! Connect via TCP
```

No code needed on our side for discovery — Citadel handles all of it.

---

## 3. Three Modes of Play

```
  void-gladiator                    →  Single-player (current behavior, unchanged)
  void-gladiator --host "MyArena"   →  Host mode (spawn citadel + run simulation)
  void-gladiator --join             →  Client mode (discover + connect + play)
  void-gladiator --join --server 192.168.1.5:7777  →  Client mode (direct connect)
```

All three modes share the same renderer and input system. The difference is
**where commands go** and **where state comes from**.

---

## 4. Single-Player (unchanged)

This is what exists today. **Zero changes needed.**

```
  ┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────┐
  │  Keyboard    │────►│  terminal-    │────►│  game-core   │────►│ renderer │──► stdout
  │  (WASD+Space)│     │  input        │     │  tickGame-   │     │ -ansi    │
  │              │     │               │     │  State()     │     │          │
  │              │     │  emits Game-  │     │              │     │ renders  │
  │              │     │  Command      │     │  returns new │     │ GameState│
  └──────────────┘     └───────────────┘     │  GameState   │     └──────────┘
                                              └──────────────┘

  Data:   keypress → GameCommand → pendingCommands[] → tickGameState() → GameState → frame
```

---

## 5. Host Mode — Full Flow

The host is the **only machine running `tickGameState()`**. It owns the truth.

```
  HOST MACHINE
  ════════════════════════════════════════════════════════════════════════

  ┌─────────────┐                                     ┌──────────────────┐
  │  Keyboard   │──GameCommand──┐                     │  Citadel Server  │
  │  (local)    │               │                     │  (child process) │
  └─────────────┘               │                     │  port 7777       │
                                │                     │                  │
                                ▼                     │  Receives remote │
                     ┌────────────────────┐           │  "game" envelopes│
                     │  COMMAND MERGER    │◄──────────│  and hands them  │
                     │                    │  remote   │  to NetworkHost  │
                     │  Local commands    │  commands │                  │
                     │  + remote commands │           │  Also sends host │
                     │  for this tick     │           │  state snapshots │
                     │                    │──────────►│  out to clients  │
                     └────────┬───────────┘  state    └──────────────────┘
                              │                              ▲    │
                              │ merged commands              │    │ TCP
                              ▼                              │    ▼
                     ┌────────────────────┐           ┌──────┴──────────┐
                     │  game-core         │           │  Remote Players │
                     │  tickGameState()   │           │  (Clients)      │
                     │                    │           └─────────────────┘
                     │  THE authority     │
                     │  for game state    │
                     └────────┬───────────┘
                              │
                              │ new GameState
                              ▼
                     ┌────────────────────┐
                     │  renderer-ansi     │──► stdout (host sees the game too)
                     └────────────────────┘
```

**Step-by-step per tick (30 Hz):**

```
  ┌──── TICK N ──────────────────────────────────────────────────────────┐
  │                                                                      │
  │  1. Collect local commands from keyboard      [move_up, fire]       │
  │                                                                      │
  │  2. Collect remote commands from all clients                         │
  │     ┌─ Player B sent: { kind:"commands", data: [move_left] }       │
  │     └─ Player C sent: { kind:"commands", data: [fire, move_down] } │
  │                                                                      │
  │  3. Merge all into one TickInput:                                    │
  │     { commands: [move_up, fire, move_left, fire, move_down] }       │
  │     (each tagged with player ID internally)                          │
  │                                                                      │
  │  4. Run tickGameState(state, mergedInput) → newState                │
  │                                                                      │
  │  5. Render newState locally (host sees game)                        │
  │                                                                      │
  │  6. Broadcast newState to all clients via Citadel:                  │
  │     { type:"game", payload: { kind:"state_snapshot", data: state }} │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Client Mode — Full Flow

The client **never runs simulation**. It only sends commands and renders what it receives.

```
  CLIENT MACHINE
  ════════════════════════════════════════════════════════════════════════

  ┌─────────────┐                                     ┌──────────────────┐
  │  Keyboard   │──GameCommand──┐                     │  Citadel Client  │
  │  (local)    │               │                     │  (TCP to server) │
  └─────────────┘               │                     │                  │
                                ▼                     │                  │
                     ┌────────────────────┐  send     │                  │
                     │  NetworkClient     │──────────►│  Sends "game"    │
                     │                    │  commands │  envelopes with  │
                     │  Wraps commands    │           │  kind:"commands" │
                     │  in game envelope  │           │  to host         │
                     │                    │           │                  │
                     │  Receives state    │◄──────────│  Receives "game" │
                     │  snapshots from    │  state    │  envelopes with  │
                     │  host              │  snapshot │  kind:"state_    │
                     └────────┬───────────┘           │  snapshot"       │
                              │                       └──────────────────┘
                              │ latest GameState
                              │ (from host)
                              ▼
                     ┌────────────────────┐
                     │  renderer-ansi     │──► stdout (client sees the game)
                     └────────────────────┘

  NOTE: No tickGameState() runs here.
        The client trusts the host's state completely.
```

**Step-by-step per frame:**

```
  ┌──── CLIENT FRAME ────────────────────────────────────────────────────┐
  │                                                                      │
  │  1. Player presses keys → GameCommand[]                             │
  │                                                                      │
  │  2. NetworkClient wraps them:                                        │
  │     Citadel Envelope {                                               │
  │       type: "game",                                                  │
  │       payload: {                                                     │
  │         kind: "commands",                                            │
  │         data: { playerId: "B", commands: ["move_left", "fire"] }    │
  │       }                                                              │
  │     }                                                                │
  │                                                                      │
  │  3. Send over TCP to Citadel server → relayed to host               │
  │                                                                      │
  │  4. Meanwhile, receive state_snapshot from host                      │
  │     (arrives ~30 times/second)                                       │
  │                                                                      │
  │  5. Replace local state with received GameState                     │
  │                                                                      │
  │  6. Render it with renderer-ansi → stdout                           │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Wire Protocol — How Bytes Move

Citadel uses **length-prefixed JSON frames** over TCP. Every message on the wire:

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                         TCP STREAM                               │
  │                                                                  │
  │  ┌─────────┬────────────────────────────────────────────┐       │
  │  │ 4 bytes │  N bytes                                   │       │
  │  │ (BE u32)│  JSON-encoded Envelope                     │       │
  │  │ N = 157 │  {"type":"game","from":"Vipul","seq":42,  │       │
  │  │         │   "payload":{"kind":"commands",            │       │
  │  │         │     "data":{"playerId":"B",                │       │
  │  │         │       "commands":["move_left","fire"]}}}   │       │
  │  └─────────┴────────────────────────────────────────────┘       │
  │                                                                  │
  │  ┌─────────┬────────────────────────────────────────────┐       │
  │  │ 4 bytes │  Next message...                           │       │
  │  └─────────┴────────────────────────────────────────────┘       │
  │  ...                                                             │
  └──────────────────────────────────────────────────────────────────┘
```

**We implement this in TypeScript** (Node.js `net.Socket`):

```typescript
// Writing a frame
function writeFrame(socket: net.Socket, data: Buffer): void {
  const header = Buffer.alloc(4);
  header.writeUInt32BE(data.length, 0);
  socket.write(header);
  socket.write(data);
}

// Reading frames (streaming — TCP gives us arbitrary chunk boundaries)
//
//   incoming bytes:  [0,0,0,12][{"type":"pi]  [ng"}][0,0,0,15][{"type":"ga...
//                    ▲ header  ▲ partial body  ▲ rest  ▲ next header
//
// A frame accumulator buffers until we have length + full body, then emits.
```

**Envelope structure** (mirrors Citadel's Go struct exactly):

```typescript
interface CitadelEnvelope {
  type: string; // "hello" | "welcome" | "game" | "chat" | "ping" | ...
  from: string; // sender name (server-derived, never trust from peers)
  to?: string; // optional target for direct messages
  seq: number; // monotonically increasing per sender
  payload?: unknown; // type-specific, see below
}
```

---

## 8. Game Message Taxonomy

Inside Citadel's `game` envelope, we define our own `kind` + `data` structure:

```
  Citadel Envelope                        Our game payload
  ─────────────────                       ─────────────────
  {                                       {
    type: "game",          ◄── Citadel      kind: "commands",      ◄── Us
    from: "PlayerB",           routes       data: {                    defines
    seq: 42,                   this           playerId: "B",           these
    payload: ───────────────────────────►     tick: 150,
  }                                           commands: ["fire"]
                                            }
                                          }
```

**Full kind taxonomy:**

```
  ┌───────────────────┬──────────────────┬──────────────────────────────────┐
  │  kind             │  direction       │  data shape                      │
  ├───────────────────┼──────────────────┼──────────────────────────────────┤
  │  commands         │  client → host   │  { playerId, tick, commands[] } │
  │  state_snapshot   │  host → clients  │  { tick, state: GameState }     │
  │  player_assign    │  host → client   │  { playerId, playerIndex }      │
  │  lobby_ready      │  client → host   │  { ready: boolean }             │
  │  game_start       │  host → clients  │  { playerCount }                │
  │  game_over        │  host → clients  │  { reason }                     │
  └───────────────────┴──────────────────┴──────────────────────────────────┘
```

**Why this works:** Citadel's server treats `game` payloads as **opaque**. It just
relays them. It doesn't parse `kind` or `data`. We own the game protocol entirely.

---

## 9. Lifecycle — From Launch to Game Over

### Host starts a game

```
  PLAYER A (host)                 CITADEL                PLAYER B (client)
  ─────────────────────          ─────────               ──────────────────

  void-gladiator --host "Arena"
         │
         ├─ spawns citadel server
         │  as child process
         │  (citadel server --name "Arena")
         │                                  ┌─────────┐
         ├─ connects to citadel ───────────►│ Citadel │
         │  via TCP localhost:7777          │ Server  │
         │                                  │         │
         ├─ sends hello ──────────────────►│ "Arena" │
         │  {name:"HostPlayer",version:1}  │ :7777   │
         │                                  │         │
         │◄─ welcome ─────────────────────│         │
         │  {server_name:"Arena",peers:[]} │         │
         │                                  │         │
         ├─ SHOWS LOBBY SCREEN             │         │
         │  "Waiting for players..."       │         │
         │  "Players: HostPlayer"          │         │
         │                                  │         │  void-gladiator --join
         │                                  │         │         │
         │                                  │◄────────│────── TCP connect
         │                                  │         │  hello {name:"Player2"}
         │                                  │────────►│  welcome {peers:["HostPlayer"]}
         │                                  │         │
         │◄─ system{event:join} ──────────│         │
         │  "Player2 joined"               │         │
         │                                  │         │
         ├─ sends player_assign ──────────►│ relay ──►│  "You are Player 2"
         │  {playerId:"P2",playerIndex:1}  │         │
         │                                  │         │
         │  LOBBY SCREEN UPDATES           │         │  LOBBY SCREEN
         │  "Players: HostPlayer, Player2" │         │  "Players: HostPlayer, Player2"
         │                                  │         │
         ├─ Host presses ENTER             │         │
         │                                  │         │
         ├─ sends game_start ─────────────►│ relay ──►│
         │  {playerCount:2}                │         │
         │                                  │         │
         ▼                                  │         ▼
     GAME RUNNING                           │     GAME RUNNING
     (simulation ticks)                     │     (render snapshots)
```

### During gameplay (steady state)

```
  TICK 150  (repeats 30 times per second)
  ════════════════════════════════════════════════════════════════════

  PLAYER B (client)              CITADEL              PLAYER A (host)
                                  SERVER

  press 'A' key
       │
       ▼
  terminal-input
  emits "move_left"
       │
       ▼
  NetworkClient wraps:
  game { kind:"commands",
    data:{playerId:"P2",
      commands:["move_left"]} }
       │
       ├───── TCP ───────────►  receives    ────── relay ───────►
                                game envelope                     │
                                                                  ▼
                                                          NetworkHost
                                                          buffers: {
                                                            P2: ["move_left"]
                                                          }
                                                                  │
                                                           host also pressed 'W':
                                                           local: ["move_up"]
                                                                  │
                                                                  ▼
                                                          MERGE COMMANDS
                                                          tick 150 input: {
                                                            P1: ["move_up"],
                                                            P2: ["move_left"]
                                                          }
                                                                  │
                                                                  ▼
                                                          tickGameState(state, merged)
                                                                  │
                                                                  ▼
                                                          new GameState (tick 150)
                                                                  │
                                                    ┌─────────────┼─────────────┐
                                                    ▼             ▼             ▼
                                              render locally   broadcast     broadcast
                                              (host screen)    to P2         to P3...
                                                               via citadel
       ◄───── TCP ──────────  relay  ◄──────────────────────────┘
       │
       ▼
  NetworkClient receives
  game { kind:"state_snapshot",
    data: { tick:150, state: GameState } }
       │
       ▼
  Replace local state
       │
       ▼
  renderer-ansi
  renders to stdout
```

### Game over

```
  HOST                           CITADEL              CLIENT
  detects gameOver:true
       │
       ├─ sends final state_snapshot ──── relay ────►  renders death screen
       │
       ├─ sends game_over ────────────── relay ────►  shows "Game Over"
       │  {reason:"all players dead"}                  waits 2s, disconnects
       │
       ├─ waits 2s
       ├─ sends leave to citadel
       ├─ kills citadel child process
       └─ exits
```

---

## 10. Package Responsibilities

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                                                                             │
  │  apps/cli-game/                 THE APP SHELL                              │
  │  ──────────────                                                            │
  │  • Parses --host / --join flags                                            │
  │  • Wires everything together based on mode                                 │
  │  • Owns process lifecycle (spawn citadel, shutdown)                        │
  │                                                                             │
  │     uses:  game-core, engine-loop, renderer-ansi, terminal-input,          │
  │            network-lan, protocol, persistence, content                      │
  │                                                                             │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │  packages/network-lan/          THE NETWORK LAYER                          │
  │  ─────────────────────                                                     │
  │  NEW code — implements Citadel wire protocol in TypeScript                 │
  │                                                                             │
  │  Exports:                                                                   │
  │  • FrameCodec        — encode/decode length-prefixed JSON frames           │
  │  • CitadelClient     — TCP connection, handshake, heartbeat, events        │
  │  • createNetworkHost — spawn citadel, manage players, merge commands       │
  │  • createNetworkClient — connect, send commands, receive snapshots         │
  │                                                                             │
  │     uses:  protocol (types only)                                           │
  │                                                                             │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │  packages/protocol/             THE SHARED TYPES                           │
  │  ──────────────────                                                        │
  │  EXTENDED — adds network message types                                     │
  │                                                                             │
  │  Existing (unchanged):                                                     │
  │  • GameCommand, CommandBatch, CommandEnvelope                              │
  │                                                                             │
  │  New:                                                                       │
  │  • CitadelEnvelope, GamePayloadKind                                        │
  │  • CommandsPayload, StateSnapshotPayload, PlayerAssignPayload              │
  │  • LobbyReadyPayload, GameStartPayload, GameOverPayload                   │
  │                                                                             │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │  packages/game-core/            THE SIMULATION                ← UNCHANGED  │
  │  packages/engine-loop/          THE TICK TIMER                ← UNCHANGED  │
  │  packages/renderer-ansi/        THE RENDERER                  ← UNCHANGED  │
  │  packages/terminal-input/       THE INPUT HANDLER             ← UNCHANGED  │
  │  packages/shared/               MATH UTILITIES                ← UNCHANGED  │
  │  packages/content/              GAME CONSTANTS                ← UNCHANGED  │
  │  packages/persistence/          HIGH SCORES                   ← UNCHANGED  │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
```

**Dependency graph (additions in bold):**

```
  cli-game ──► game-core ──► shared, content, protocol
           ──► engine-loop ──► shared
           ──► renderer-ansi ──► game-core (types only)
           ──► terminal-input ──► protocol
           ──► network-lan ──► protocol          ◄── NEW dependency
           ──► persistence
           ──► content
           ──► protocol
```

---

## 11. What Changes, What Doesn't

```
  ┌──────────────────────────┬────────┬────────────────────────────────────┐
  │  File / Package          │ Status │ What changes                       │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/network-lan/   │  NEW   │ Wire protocol, CitadelClient,     │
  │                          │        │ NetworkHost, NetworkClient         │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/protocol/      │ EXTEND │ Add network message types.        │
  │                          │        │ Existing types untouched.         │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  apps/cli-game/main.ts   │ EXTEND │ Add --host/--join flag parsing.   │
  │                          │        │ Wire up NetworkHost or            │
  │                          │        │ NetworkClient based on mode.      │
  │                          │        │ Default (no flags) = unchanged.   │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/game-core/     │  NONE  │ Zero changes. Simulation is       │
  │                          │        │ already command-driven.           │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/engine-loop/   │  NONE  │ Zero changes.                     │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/renderer-ansi/ │  NONE  │ Zero changes. Renders any         │
  │                          │        │ GameState — local or from network.│
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/terminal-input/│  NONE  │ Zero changes.                     │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/shared/        │  NONE  │ Zero changes.                     │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/content/       │  NONE  │ Zero changes.                     │
  ├──────────────────────────┼────────┼────────────────────────────────────┤
  │  packages/persistence/   │  NONE  │ Zero changes.                     │
  └──────────────────────────┴────────┴────────────────────────────────────┘
```

**This is the power of the existing command-driven architecture.** The simulation
doesn't care if commands came from a keyboard or a network socket. It just processes
`GameCommand[]` and returns `GameState`.

---

## 12. FAQ

### Why not rewrite Citadel in TypeScript?

Citadel already works. It handles discovery, connection management, heartbeats, chat,
and all the messy networking edge cases. Reimplementing that in TypeScript would take
weeks for zero game benefit. Instead, we write a thin TypeScript TCP client (~200 lines)
that speaks Citadel's wire protocol.

### Why not use WebSockets?

Citadel uses raw TCP with length-prefixed JSON. For LAN gaming this is ideal — lower
overhead than WebSocket, no HTTP upgrade handshake, no browser constraints. Both sides
are terminal apps on the same network.

### How does the host handle late-arriving commands?

If a client's commands arrive after the tick has already been processed, they're buffered
for the next tick. At 30 Hz on a LAN (sub-1ms latency), this is effectively imperceptible.
No rollback or prediction needed.

### What about GameState size — isn't it expensive to send 30x/sec?

A typical Void Gladiator state serializes to ~2-5 KB (player + enemies + projectiles).
At 30 Hz that's ~150 KB/s — trivial for any LAN. If it grows, we can switch to delta
compression later (Citadel's framing is encoding-agnostic by design).

### What if Citadel isn't installed?

The game checks for `citadel` on PATH at startup when `--host` or `--join` is used.
If missing, it prints:

```
  Error: 'citadel' not found on PATH.
  Install it with: brew tap vipul0092/citadel && brew install citadel
```

### Can clients chat in the lobby?

Yes — for free! Citadel has built-in `chat` message support. We can expose it in the
lobby screen with zero additional protocol work.

### What about multiplayer game state — multiple players?

The current `GameState` has a single `player`. For multiplayer, we'll extend it to
`players: PlayerState[]` where each player has an ID matching their network identity.
The simulation change is minimal — the host just processes each player's commands
independently in the same tick.

---

_This document lives at `MULTIPLAYER_ARCHITECTURE.md` in the repo root.  
Reference it alongside `TECH_ARCHITECTURE.md` and `VOID_GLADIATOR_SPEC.md`._
