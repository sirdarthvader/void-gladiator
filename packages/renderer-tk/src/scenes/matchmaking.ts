import type { MatchmakingScene, MatchmakingState } from '@void-gladiator/game-core';
import { GAME_MODES } from '@void-gladiator/content';
import type { Screen } from '../screen.js';
import {
  ARENA_X_OFFSET,
  putText,
  clearScreen,
} from '../screen.js';
import { ATTR_BORDER, ATTR_HUD_DIM } from '../colors.js';

const CHAT_LOG_LINES = 6;

// Palette matches ANSI renderer — index 0 = self, 1..N = peers in join order.
const PLAYER_COLORS = ['cyan', 'yellow', 'green', 'magenta', 'red', 'blue'] as const;
type PaletteColor = (typeof PLAYER_COLORS)[number];

const buildColorMap = (mm: MatchmakingState): Record<string, PaletteColor> => {
  const all = [mm.myName, ...mm.peers.map((p) => p.name)];
  const map: Record<string, PaletteColor> = {};
  all.forEach((name, i) => {
    map[name] = PLAYER_COLORS[i % PLAYER_COLORS.length];
  });
  return map;
};

export const renderMatchmaking = (state: MatchmakingScene, screen: Screen): void => {
  const { matchmaking: mm } = state;
  clearScreen(screen);

  const width = state.arenaWidth;
  const boxTop = 1;
  const boxBottom = screen.height - 2;
  const boxLeft = 0;
  const boxRight = width + 1;
  const mode = GAME_MODES[mm.selectedMode];
  const colorFor = buildColorMap(mm);
  const selfColor = colorFor[mm.myName] ?? 'cyan';

  // ── Box border ────────────────────────────────────────────────────
  for (let x = boxLeft; x <= boxRight; x++) {
    putText(screen, x, boxTop, '-', ATTR_BORDER);
    putText(screen, x, boxBottom, '-', ATTR_BORDER);
  }
  for (let y = boxTop + 1; y < boxBottom; y++) {
    putText(screen, boxLeft, y, '|', ATTR_BORDER);
    putText(screen, boxRight, y, '|', ATTR_BORDER);
  }
  putText(screen, boxLeft, boxTop, '+', ATTR_BORDER);
  putText(screen, boxRight, boxTop, '+', ATTR_BORDER);
  putText(screen, boxLeft, boxBottom, '+', ATTR_BORDER);
  putText(screen, boxRight, boxBottom, '+', ATTR_BORDER);

  let y = boxTop + 1;
  const x0 = ARENA_X_OFFSET + 2;

  // ── Header ────────────────────────────────────────────────────────
  const roleStr = mm.role === 'host' ? '[HOST]' : '[GUEST]';
  putText(screen, x0, y, roleStr, {
    color: mm.role === 'host' ? 'cyan' : 'yellow',
    bgColor: 'black',
    bold: true,
  });
  putText(screen, x0 + roleStr.length + 2, y, mm.roomName, {
    color: 'cyan',
    bgColor: 'black',
    bold: true,
  });
  const asText = 'as ';
  putText(screen, x0 + roleStr.length + 2 + mm.roomName.length + 2, y, asText, ATTR_HUD_DIM);
  putText(screen, x0 + roleStr.length + 2 + mm.roomName.length + 2 + asText.length, y, mm.myName, {
    color: selfColor,
    bgColor: 'black',
    bold: true,
  });
  y += 2;

  // ── Peer list ─────────────────────────────────────────────────────
  putText(screen, x0, y, 'Peers:', ATTR_HUD_DIM);
  y++;
  if (mm.peers.length === 0) {
    putText(screen, x0 + 2, y, '(waiting for players...)', ATTR_HUD_DIM);
    y++;
  } else {
    for (const peer of mm.peers.slice(0, 4)) {
      const peerColor = colorFor[peer.name] ?? 'white';
      putText(screen, x0 + 2, y, '* ', ATTR_HUD_DIM);
      putText(screen, x0 + 4, y, peer.name, {
        color: peerColor,
        bgColor: 'black',
        bold: true,
      });
      if (peer.name === mm.hostName) {
        putText(screen, x0 + 4 + peer.name.length + 1, y, '(H)', ATTR_HUD_DIM);
      }
      y++;
    }
  }
  y++;

  // ── Mode picker ───────────────────────────────────────────────────
  putText(screen, x0, y, 'Mode: ', ATTR_HUD_DIM);
  putText(screen, x0 + 6, y, `[${mode.name.toUpperCase()}]`, {
    color: 'yellow',
    bgColor: 'black',
    bold: true,
  });
  if (mm.role === 'host') {
    putText(screen, x0 + 6 + mode.name.length + 4, y, '<< >>', ATTR_HUD_DIM);
  }
  y += 2;

  // ── Chat log ──────────────────────────────────────────────────────
  putText(screen, x0, y, 'Chat:', ATTR_HUD_DIM);
  y++;

  const logSlice = mm.chatLog.slice(-CHAT_LOG_LINES);
  for (let i = 0; i < CHAT_LOG_LINES; i++) {
    const line = logSlice[i];
    if (line) {
      if (line.system) {
        putText(screen, x0 + 2, y, `-- ${line.text} --`, ATTR_HUD_DIM);
      } else {
        const nameColor = colorFor[line.name] ?? 'white';
        const nameStr = `${line.name}:`;
        putText(screen, x0 + 2, y, nameStr, { color: nameColor, bgColor: 'black', bold: true });
        putText(screen, x0 + 2 + nameStr.length + 1, y, line.text, { color: 'white', bgColor: 'black' });
      }
    }
    y++;
  }

  // ── Footer ────────────────────────────────────────────────────────
  const instrY = boxBottom - 1;
  if (mm.connectionLost) {
    putText(screen, x0, instrY, 'Connection lost — exiting...', {
      color: 'yellow',
      bgColor: 'black',
      bold: true,
    });
  } else if (mm.chatInput.active) {
    putText(screen, x0, instrY - 1, `> ${mm.chatInput.draft}|`, {
      color: 'green',
      bgColor: 'black',
    });
    putText(screen, x0, instrY, '[Enter] send  [Esc] cancel', ATTR_HUD_DIM);
  } else {
    const hostHints = mm.role === 'host' ? '[Space] start  [</> ] mode  ' : '';
    putText(screen, x0, instrY, `[t]alk  ${hostHints}[q]uit`, ATTR_HUD_DIM);
  }
};
