import type { GameModeId } from '@void-gladiator/content';

export interface MatchmakingPeer {
  name: string;
}

export interface ChatLine {
  name: string;
  text: string;
  /** True for system events (join/leave). Renderers display these in a muted style. */
  system?: boolean;
}

export interface ChatInput {
  active: boolean;
  draft: string;
}

export interface StartEnvelope {
  mode: GameModeId;
  seed: number;
  players: Array<{ id: number; name: string }>;
  startedBy: string;
}

export interface MatchmakingState {
  role: 'host' | 'guest';
  myName: string;
  roomName: string;
  hostName: string | null;
  peers: MatchmakingPeer[];
  chatLog: ChatLine[];
  selectedMode: GameModeId;
  chatInput: ChatInput;
  pendingStart: StartEnvelope | null;
  connectionLost: boolean;
}
