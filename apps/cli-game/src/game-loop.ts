/**
 * GameLoop — owns the 30Hz ticker, command queue, chat draft, terminal
 * input, and the title → connect → matchmaking boot flow.
 *
 * Single-player: pass no onConnect. The tick is a pure tickApp + render loop.
 * Multiplayer:   pass onConnect. When the user confirms on the title screen
 *                the loop stops, awaits the connection, then resumes with the
 *                adapter's initial matchmaking state.
 */

import { createTicker } from '@void-gladiator/engine-loop';
import { tickApp } from '@void-gladiator/game-core';
import type { AppState } from '@void-gladiator/game-core';
import { createSceneInput } from '@void-gladiator/terminal-input';
import type { SceneContext } from '@void-gladiator/terminal-input';
import type { Renderer } from '@void-gladiator/renderer-tk';
import type { Command } from '@void-gladiator/protocol';
import type { MultiplayerAdapter } from './multiplayer-adapter.js';

// ── Public types ─────────────────────────────────────────────────────

export interface GameLoopOptions {
  renderer: Renderer;
  onShutdown: () => never;
  /** If provided, called when the user presses confirm on the title screen. */
  onConnect?: () => Promise<MultiplayerAdapter>;
}

export interface GameLoop {
  start(initialState: AppState): void;
  /** Detaches input, stops ticker, cleans renderer, closes adapter. */
  stop(): void;
}

// ── Factory ───────────────────────────────────────────────────────────

export const createGameLoop = (options: GameLoopOptions): GameLoop => {
  const { renderer, onShutdown, onConnect } = options;

  let state: AppState = undefined as unknown as AppState; // set by start()
  let adapter: MultiplayerAdapter | null = null;
  let pendingCommands: Command[] = [];
  let chatDraft = '';
  let localChatActive = false;

  // ── Chat draft helpers ─────────────────────────────────────────────

  const clearChatDraft = (): void => {
    chatDraft = '';
    if (state.scene === 'matchmaking') {
      state = {
        ...state,
        matchmaking: {
          ...state.matchmaking,
          chatInput: { active: false, draft: '' },
        },
      };
    }
  };

  // ── Terminal input ─────────────────────────────────────────────────

  const getScene = (): SceneContext => state.scene as SceneContext;

  const terminalInput = createSceneInput({
    onCommand: (command) => {
      if (command === 'quit') { onShutdown(); return; }
      if (command === 'enter_chat') localChatActive = true;
      if (command === 'submit_chat') localChatActive = false;
      if (command === 'cancel_chat') { localChatActive = false; clearChatDraft(); }
      pendingCommands.push(command);
    },
    onChatChar: (char) => {
      if (char === '\x7f' || char === '\b') {
        chatDraft = chatDraft.slice(0, -1);
      } else {
        chatDraft += char;
      }
      if (state.scene === 'matchmaking') {
        state = {
          ...state,
          matchmaking: {
            ...state.matchmaking,
            chatInput: { ...state.matchmaking.chatInput, draft: chatDraft },
          },
        };
      }
    },
    getChatActive: () => localChatActive,
    getScene,
  });

  // ── Ticker ─────────────────────────────────────────────────────────

  const render = (): void => renderer.render(state);

  const handleConnect = (): void => {
    if (!onConnect) return;
    ticker.stop();
    onConnect()
      .then((a) => {
        adapter = a;
        state = a.initialState;
        ticker.start();
      })
      .catch((err: unknown) => {
        process.stderr.write(`\nFailed to connect: ${String(err)}\n`);
        onShutdown();
      });
  };

  const ticker = createTicker({
    fps: 30,
    tick: () => {
      const cmds = [...pendingCommands];
      pendingCommands = [];

      if (cmds.includes('quit')) { onShutdown(); return; }

      // Title + multiplayer: intercept confirm to trigger async connect.
      if (state.scene === 'title' && onConnect && !adapter) {
        if (cmds.includes('confirm')) {
          handleConnect();
        } else {
          render();
        }
        return;
      }

      // Drain adapter (outbox flush + inbound patch) before advancing state.
      const matchmakingPatch = adapter?.drain(cmds, state, chatDraft) ?? {};

      // Chat draft is consumed by drain(); clear the local copy now.
      if (cmds.includes('submit_chat')) chatDraft = '';

      const prevMode =
        state.scene === 'matchmaking' ? state.matchmaking.selectedMode : null;

      const commandsByPlayer = new Map<number, readonly Command[]>();
      if (cmds.length > 0) commandsByPlayer.set(0, cmds);

      state = tickApp(state, { commandsByPlayer, matchmakingPatch });

      // Notify adapter if the host changed mode (so it can broadcast).
      if (
        adapter &&
        state.scene === 'matchmaking' &&
        prevMode !== null &&
        state.matchmaking.selectedMode !== prevMode
      ) {
        adapter.notifyModeChanged(state.matchmaking.selectedMode);
      }

      // Connection lost: render the disconnected state, then exit.
      if (matchmakingPatch.connectionLost && state.scene === 'matchmaking') {
        render();
        setTimeout(() => onShutdown(), 1500);
        ticker.stop();
        return;
      }

      render();
    },
  });

  // ── Public interface ───────────────────────────────────────────────

  return {
    start(initialState) {
      state = initialState;

      if (process.env.VOID_GLADIATOR_ONCE === '1') {
        render();
        return;
      }

      renderer.init();
      terminalInput.attach();
      ticker.start();
      process.on('SIGINT', onShutdown);
    },

    stop() {
      ticker.stop();
      terminalInput.detach();
      adapter?.close();
      renderer.cleanup();
    },
  };
};
