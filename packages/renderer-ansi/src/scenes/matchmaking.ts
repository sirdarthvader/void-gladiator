import type { MatchmakingScene, MatchmakingState } from '@void-gladiator/game-core';
import { GAME_MODES } from '@void-gladiator/content';
import chalk from 'chalk';
import { bold, dim, cyan, green, yellow, whiteBright } from '../colors.js';
import { buildTopBorder, buildBottomBorder, centerText, padRight } from '../components/ui.js';
import { stringWidth, cursorToCol } from '../char-width.js';

const CHAT_LOG_LINES = 6;

// Palette matches citadel's own player coloring — index 0 = self, 1..N = peers in join order.
const PLAYER_PALETTE: Array<(s: string) => string> = [
  chalk.cyan,
  chalk.yellow,
  chalk.green,
  chalk.magenta,
  chalk.red,
  chalk.blue,
];

const buildColorMap = (mm: MatchmakingState): Record<string, (s: string) => string> => {
  const all = [mm.myName, ...mm.peers.map((p) => p.name)];
  const map: Record<string, (s: string) => string> = {};
  all.forEach((name, i) => {
    map[name] = PLAYER_PALETTE[i % PLAYER_PALETTE.length];
  });
  return map;
};

const borderedRow = (content: string, width: number): string => {
  const rightPad = Math.max(0, width - stringWidth(content));
  return `${dim('|')}${content}${' '.repeat(rightPad)}${cursorToCol(width + 2)}${dim('|')}`;
};

const emptyRow = (width: number): string =>
  `${dim('|')}${' '.repeat(width)}${cursorToCol(width + 2)}${dim('|')}`;

export const renderMatchmaking = (state: MatchmakingScene): string => {
  const { matchmaking: mm } = state;
  const width = state.arenaWidth;
  const rows: string[] = [];
  const mode = GAME_MODES[mm.selectedMode];
  const colorFor = buildColorMap(mm);
  const selfColor = colorFor[mm.myName] ?? chalk.cyan;

  rows.push('');
  rows.push(buildTopBorder(width));

  // Header: role + room + name
  const roleTag = mm.role === 'host' ? cyan(bold('[HOST]')) : yellow(bold('[GUEST]'));
  const headerContent = `  ${roleTag}  ${cyan(bold(mm.roomName))}  ${dim('as')} ${selfColor(bold(mm.myName))}`;
  rows.push(borderedRow(headerContent, width));
  rows.push(emptyRow(width));

  // Peer list (up to 4 peers)
  rows.push(borderedRow(`  ${dim('Peers:')}`, width));
  if (mm.peers.length === 0) {
    rows.push(borderedRow(`    ${dim('(waiting for players...)')}`, width));
  } else {
    for (const peer of mm.peers.slice(0, 4)) {
      const peerColor = colorFor[peer.name] ?? chalk.white;
      const hostTag = peer.name === mm.hostName ? ` ${dim('(H)')}` : '';
      rows.push(borderedRow(`    ${green('◆')} ${peerColor(peer.name)}${hostTag}`, width));
    }
  }
  rows.push(emptyRow(width));

  // Mode picker
  const modeArrows = mm.role === 'host' ? dim(' ← →') : '';
  const modeLine = `  Mode: ${yellow(bold(`[${mode.name.toUpperCase()}]`))}${modeArrows}`;
  rows.push(borderedRow(modeLine, width));
  rows.push(emptyRow(width));

  // Chat log header
  rows.push(borderedRow(`  ${dim('Chat:')}`, width));

  // Chat log (last N lines)
  const logSlice = mm.chatLog.slice(-CHAT_LOG_LINES);
  for (let i = 0; i < CHAT_LOG_LINES; i++) {
    const line = logSlice[i];
    if (line) {
      const entry = line.system
        ? `    ${dim(`-- ${line.text} --`)}`
        : `    ${(colorFor[line.name] ?? chalk.white)(bold(line.name))}: ${line.text}`;
      rows.push(borderedRow(entry, width));
    } else {
      rows.push(emptyRow(width));
    }
  }

  rows.push(emptyRow(width));

  // Chat input or instructions
  if (mm.chatInput.active) {
    const prompt = `  ${green('>')} ${mm.chatInput.draft}${whiteBright('█')}`;
    rows.push(borderedRow(prompt, width));
    rows.push(borderedRow(dim('  [Enter] send  [Esc] cancel'), width));
  } else if (mm.connectionLost) {
    rows.push(
      borderedRow(centerText(yellow(bold('Connection lost — exiting...')), width), width)
    );
    rows.push(emptyRow(width));
  } else {
    const hostHints =
      mm.role === 'host'
        ? '[Space] start  [←/→] mode  '
        : '';
    const hints = dim(`  [t]alk  ${hostHints}[q]uit`);
    rows.push(borderedRow(padRight(hints, width), width));
    rows.push(emptyRow(width));
  }

  rows.push(buildBottomBorder(width));
  rows.push('');

  return rows.join('\n');
};
