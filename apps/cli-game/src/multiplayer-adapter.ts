/**
 * MultiplayerAdapter — owns all citadel networking for one game session.
 *
 * The game loop calls drain() once per tick to:
 *   1. Flush the outbox (send queued chat / mode-change / start to citadel).
 *   2. Return an inbound MatchmakingNetworkPatch for tickApp to consume.
 *
 * The adapter handles the citadel no-echo rule internally: when the host
 * sends a start envelope, drain() includes it in the same patch so the
 * host's game transitions identically to every guest's game.
 */

import { createMatchmakingState } from '@void-gladiator/game-core';
import type {
  AppState,
  ChatLine,
  MatchmakingNetworkPatch,
  StartEnvelope,
} from '@void-gladiator/game-core';
import { CitadelClient, spawnHost, spawnGuest } from '@void-gladiator/network-citadel';
import type { Ev, EvGame } from '@void-gladiator/network-citadel';
import type { Command } from '@void-gladiator/protocol';
import { ARENA_WIDTH, ARENA_HEIGHT } from '@void-gladiator/content';

// ── Public types ─────────────────────────────────────────────────────

export interface MultiplayerSessionConfig {
  role: 'host' | 'guest';
  name: string;
  room: string;
  port: number;
  server: string;
}

export interface MultiplayerAdapter {
  /** The AppState to use immediately after connect() resolves. */
  readonly initialState: AppState;
  /**
   * Called once per tick, before tickApp.
   * Flushes last tick's outbox, queues this tick's outbox from cmds,
   * and returns the inbound patch.
   */
  drain(
    cmds: readonly Command[],
    currentState: AppState,
    chatDraft: string,
  ): MatchmakingNetworkPatch;
  /** Called after tickApp when the host's selected mode changed. */
  notifyModeChanged(newMode: string): void;
  close(): void;
}

// ── Factory ───────────────────────────────────────────────────────────

export const connectMultiplayer = async (
  config: MultiplayerSessionConfig,
): Promise<MultiplayerAdapter> => {
  const { role, name, room, port, server } = config;

  const citadelProcess =
    role === 'host'
      ? await spawnHost({ name: room, myName: name, port })
      : await spawnGuest({ server, name });

  // ── Inbound accumulator ──────────────────────────────────────────
  let peers: Array<{ name: string }> = [];
  const newChatLines: ChatLine[] = [];
  let modeBroadcast: string | null = null;
  let startEnvelope: StartEnvelope | null = null;
  let connectionLost = false;
  let roomNameUpdate: string | null = null;
  let hostNameUpdate: string | null = null;
  let seenLive = false;

  // ── Outbox (queued by THIS tick, flushed NEXT tick) ──────────────
  let pendingChatSend: string | null = null;
  let pendingModeChange: string | null = null;
  let pendingStart = false;

  const client = new CitadelClient(citadelProcess.sockPath);

  const handleEvent = (ev: Ev): void => {
    switch (ev.ev) {
      case 'live':
        seenLive = true;
        client.listPeers();
        break;
      case 'peer-join':
        if (!peers.find((p) => p.name === ev.name)) {
          peers = [...peers, { name: ev.name }];
          newChatLines.push({ name: '', text: `${ev.name} joined`, system: true });
          if (role === 'host') {
            client.sendGame('host-announce', { name, room });
          }
        }
        break;
      case 'peer-leave':
        peers = peers.filter((p) => p.name !== ev.name);
        newChatLines.push({ name: '', text: `${ev.name} left`, system: true });
        break;
      case 'peers':
        if (seenLive) {
          peers = ev.peers.map((p: { name: string }) => ({ name: p.name }));
        }
        break;
      case 'kick':
        peers = peers.filter((p) => p.name !== ev.name);
        newChatLines.push({ name: '', text: `${ev.name} was kicked`, system: true });
        break;
      case 'chat': {
        const raw = ev as unknown as Record<string, unknown>;
        const senderName = (ev.name || raw['From'] || raw['from'] || '?') as string;
        const text = (ev.text || (raw['Payload'] as Record<string, unknown>)?.['text'] || '') as string;
        if (text) newChatLines.push({ name: senderName, text });
        break;
      }
      case 'game': {
        const gameEv = ev as EvGame;
        if (gameEv.kind === 'guest-hello') {
          if (role === 'host') {
            client.sendGame('host-announce', { name, room });
          }
        } else if (gameEv.kind === 'host-announce') {
          const d = gameEv.data as { name: string; room?: string };
          hostNameUpdate = d.name;
          if (d.room) roomNameUpdate = d.room;
        } else if (gameEv.kind === 'mode-changed') {
          modeBroadcast = (gameEv.data as { mode: string }).mode;
        } else if (gameEv.kind === 'start') {
          startEnvelope = gameEv.data as StartEnvelope;
        }
        break;
      }
      case 'bye':
        connectionLost = true;
        break;
    }
  };

  client.on('event', handleEvent);
  client.on('close', () => { connectionLost = true; });
  client.on('error', () => { connectionLost = true; });

  await client.dial();
  client.subscribe('full');
  client.subscribeGame();

  const initialState: AppState = {
    scene: 'matchmaking',
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    matchmaking: {
      ...createMatchmakingState(role, name, role === 'host' ? room : '...'),
      hostName: role === 'host' ? name : null,
    },
  };

  if (role === 'host') {
    client.sendGame('host-announce', { name, room });
  } else {
    client.sendGame('guest-hello', { name });
  }

  // ── Adapter object ───────────────────────────────────────────────

  return {
    initialState,

    drain(cmds, currentState, chatDraft) {
      const mm = currentState.scene === 'matchmaking' ? currentState.matchmaking : null;

      // Flush outbox from LAST tick
      if (pendingChatSend !== null && pendingChatSend.trim()) {
        client.sendChat(pendingChatSend);
      }
      pendingChatSend = null;

      if (pendingModeChange !== null && role === 'host') {
        client.sendGame('mode-changed', { mode: pendingModeChange });
      }
      pendingModeChange = null;

      if (pendingStart && role === 'host' && mm) {
        const allPeers = [
          { id: 0, name },
          ...mm.peers.map((p, i) => ({ id: i + 1, name: p.name })),
        ];
        const env: StartEnvelope = {
          mode: mm.selectedMode,
          seed: Math.floor(Math.random() * 2 ** 31),
          players: allPeers,
          startedBy: name,
        };
        client.sendGame('start', env);
        // Citadel doesn't echo to sender — apply locally so host transitions too.
        startEnvelope = env;
      }
      pendingStart = false;

      // Queue new outbox items from THIS tick's commands
      if (cmds.includes('submit_chat') && chatDraft.trim()) {
        pendingChatSend = chatDraft;
      }
      if (cmds.includes('start_session') && role === 'host') {
        pendingStart = true;
      }

      // Build inbound patch
      const patch: MatchmakingNetworkPatch = {};
      if (roomNameUpdate !== null) { patch.roomName = roomNameUpdate; roomNameUpdate = null; }
      if (hostNameUpdate !== null) { patch.hostName = hostNameUpdate; hostNameUpdate = null; }
      patch.peers = [...peers];
      if (newChatLines.length > 0) { patch.chatLines = [...newChatLines]; newChatLines.length = 0; }
      if (modeBroadcast) { patch.modeBroadcast = modeBroadcast; modeBroadcast = null; }
      if (startEnvelope) { patch.startEnvelope = startEnvelope; startEnvelope = null; }
      if (connectionLost) patch.connectionLost = true;

      return patch;
    },

    notifyModeChanged(newMode) {
      pendingModeChange = newMode;
    },

    close() {
      client.close();
      citadelProcess.kill();
    },
  };
};
