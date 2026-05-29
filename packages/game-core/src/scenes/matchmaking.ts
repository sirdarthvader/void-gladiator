import type { AppState, MatchmakingScene } from '../types/app-state.js';
import type { MatchmakingState, StartEnvelope } from '../types/matchmaking-state.js';
import type { Command } from '@void-gladiator/protocol';
import { GAME_MODE_LIST } from '@void-gladiator/content';
import { createGameplayState } from './gameplay.js';

/**
 * External events injected by main.ts from the citadel adapter.
 * The tick function is pure; this is the only side-channel.
 */
export interface MatchmakingNetworkPatch {
  peers?: Array<{ name: string }>;
  chatLines?: Array<{ name: string; text: string }>;
  modeBroadcast?: string;
  startEnvelope?: StartEnvelope;
  connectionLost?: boolean;
  roomName?: string;
  hostName?: string;
}

export const createMatchmakingState = (
  role: 'host' | 'guest',
  myName: string,
  roomName: string
): MatchmakingState => ({
  role,
  myName,
  roomName,
  hostName: role === 'host' ? myName : null,
  peers: [],
  chatLog: [],
  selectedMode: 'void_storm',
  chatInput: { active: false, draft: '' },
  pendingStart: null,
  connectionLost: false,
});

export const tickMatchmaking = (
  state: MatchmakingScene,
  commandsByPlayer: ReadonlyMap<number, readonly Command[]>,
  patch: MatchmakingNetworkPatch = {}
): AppState => {
  let mm = state.matchmaking;

  // Apply network patches first (citadel events from main.ts)
  if (patch.roomName !== undefined) {
    mm = { ...mm, roomName: patch.roomName };
  }
  if (patch.hostName !== undefined) {
    mm = { ...mm, hostName: patch.hostName };
  }
  if (patch.peers !== undefined) {
    mm = { ...mm, peers: patch.peers };
  }
  if (patch.chatLines && patch.chatLines.length > 0) {
    mm = { ...mm, chatLog: [...mm.chatLog, ...patch.chatLines].slice(-50) };
  }
  if (patch.modeBroadcast) {
    const modeId = patch.modeBroadcast;
    if (GAME_MODE_LIST.includes(modeId as never)) {
      mm = { ...mm, selectedMode: modeId as (typeof GAME_MODE_LIST)[number] };
    }
  }
  if (patch.startEnvelope) {
    mm = { ...mm, pendingStart: patch.startEnvelope };
  }
  if (patch.connectionLost) {
    mm = { ...mm, connectionLost: true };
  }

  // If host triggered start and we have the envelope, transition to gameplay
  if (mm.pendingStart) {
    const env = mm.pendingStart;
    return {
      scene: 'gameplay',
      arenaWidth: state.arenaWidth,
      arenaHeight: state.arenaHeight,
      gameplay: createGameplayState(
        env.mode,
        env.players,
        state.arenaWidth,
        state.arenaHeight
      ),
    };
  }

  // Connection lost — stay in matchmaking but flag is rendered
  if (mm.connectionLost) {
    return { ...state, matchmaking: mm };
  }

  // Process local commands
  const commands = commandsByPlayer.get(0) ?? [];
  for (const cmd of commands) {
    mm = applyCommand(mm, cmd);
  }

  return { ...state, matchmaking: mm };
};

const applyCommand = (mm: MatchmakingState, cmd: Command): MatchmakingState => {
  if (mm.chatInput.active) {
    switch (cmd) {
      case 'submit_chat':
        // draft is consumed by main.ts outbox; reset here
        return { ...mm, chatInput: { active: false, draft: '' } };
      case 'cancel_chat':
        return { ...mm, chatInput: { active: false, draft: '' } };
      default:
        return mm;
    }
  }

  switch (cmd) {
    case 'enter_chat':
      return { ...mm, chatInput: { active: true, draft: '' } };

    case 'select_mode_next': {
      if (mm.role !== 'host') return mm;
      const idx = GAME_MODE_LIST.indexOf(mm.selectedMode);
      const next = GAME_MODE_LIST[(idx + 1) % GAME_MODE_LIST.length];
      return { ...mm, selectedMode: next };
    }
    case 'select_mode_prev': {
      if (mm.role !== 'host') return mm;
      const idx = GAME_MODE_LIST.indexOf(mm.selectedMode);
      const prev =
        GAME_MODE_LIST[(idx - 1 + GAME_MODE_LIST.length) % GAME_MODE_LIST.length];
      return { ...mm, selectedMode: prev };
    }

    // start_session is handled in main.ts (it needs to sendGame); here we just no-op
    default:
      return mm;
  }
};
