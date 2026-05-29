/**
 * TypeScript types for the citadel control protocol op/ev catalog.
 * Reference: docs/control.md in the citadel repo.
 */

// ── Ops (attacher → citadel) ─────────────────────────────────────────

export interface OpSubscribe {
  op: 'subscribe';
  level: 'summary' | 'full';
  since: number;
}

export interface OpSetLevel {
  op: 'set-level';
  level: 'summary' | 'full';
  since: number;
}

export interface OpSubscribeGame {
  op: 'subscribe-game';
}

export interface OpUnsubscribeGame {
  op: 'unsubscribe-game';
}

export interface OpSendChat {
  op: 'send-chat';
  text: string;
  to: string;
}

export interface OpSendGame {
  op: 'send-game';
  kind: string;
  to: string;
  data: unknown;
}

export interface OpListPeers {
  op: 'list-peers';
}

export interface OpKick {
  op: 'kick';
  name: string;
  reason: string;
}

export interface OpPing {
  op: 'ping';
}

export interface OpShutdown {
  op: 'shutdown';
}

export type Op =
  | OpSubscribe
  | OpSetLevel
  | OpSubscribeGame
  | OpUnsubscribeGame
  | OpSendChat
  | OpSendGame
  | OpListPeers
  | OpKick
  | OpPing
  | OpShutdown;

// ── Events (citadel → attacher) ──────────────────────────────────────

export interface EvHello {
  ev: 'hello';
  role: 'server' | 'client';
  name: string;
  version: string;
}

export interface EvStatus {
  ev: 'status';
  seq: number;
  at: string;
  peers: number;
  motd: string;
  uptime_sec: number;
}

export interface EvPeerJoin {
  ev: 'peer-join';
  seq: number;
  at: string;
  name: string;
}

export interface EvPeerLeave {
  ev: 'peer-leave';
  seq: number;
  at: string;
  name: string;
}

export interface EvPeer {
  name: string;
  ip: string;
  connected: string;
}

export interface EvPeers {
  ev: 'peers';
  seq: number;
  at: string;
  peers: EvPeer[];
}

export interface EvChat {
  ev: 'chat';
  seq: number;
  at: string;
  name: string;
  text: string;
}

export interface EvChatDirect {
  ev: 'chat-direct';
  seq: number;
  at: string;
  name: string;
  to: string;
  text: string;
}

export interface EvSay {
  ev: 'say';
  seq: number;
  at: string;
  text: string;
}

export interface EvMotdChanged {
  ev: 'motd-changed';
  seq: number;
  at: string;
  text: string;
}

export interface EvKick {
  ev: 'kick';
  seq: number;
  at: string;
  name: string;
  reason: string;
}

export interface EvGame {
  ev: 'game';
  from: string;
  kind: string;
  to: string;
  data: unknown;
}

export interface EvLive {
  ev: 'live';
}

export interface EvGap {
  ev: 'gap';
  missing_from: number;
  missing_to: number;
}

export interface EvError {
  ev: 'error';
  code: string;
  msg: string;
}

export interface EvPong {
  ev: 'pong';
}

export interface EvBye {
  ev: 'bye';
  reason: string;
}

export type Ev =
  | EvHello
  | EvStatus
  | EvPeerJoin
  | EvPeerLeave
  | EvPeers
  | EvChat
  | EvChatDirect
  | EvSay
  | EvMotdChanged
  | EvKick
  | EvGame
  | EvLive
  | EvGap
  | EvError
  | EvPong
  | EvBye;

export const isEv = (obj: unknown): obj is Ev => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'ev' in obj &&
    typeof (obj as Record<string, unknown>)['ev'] === 'string'
  );
};
