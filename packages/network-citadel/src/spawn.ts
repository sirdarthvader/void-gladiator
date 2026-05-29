/**
 * Spawns citadel sidecar processes for host and guest roles.
 * Uses `citadel host --headless` or `citadel connect --headless`.
 * Reads the pointer file after spawn to return the UDS socket path.
 */

import { spawn, type ChildProcess } from 'child_process';
import { unlink } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { readHostPointer, readClientPointer } from './pointer.js';

export interface SpawnedSession {
  sockPath: string;
  child: ChildProcess;
  kill: () => void;
}

export interface HostOptions {
  name: string;
  myName: string;
  port?: number;
  motd?: string;
}

export interface GuestOptions {
  server: string;
  name: string;
}

const spawnDetached = (args: string[]): ChildProcess => {
  const child = spawn('citadel', args, {
    detached: false,
    stdio: 'ignore',
  });
  child.unref();
  return child;
};

export const spawnHost = async (opts: HostOptions): Promise<SpawnedSession> => {
  const args = [
    'host',
    '--name',
    opts.name,
    '--my-name',
    opts.myName,
    '--port',
    String(opts.port ?? 7777),
  ];
  if (opts.motd) args.push('--motd', opts.motd);

  const child = spawnDetached(args);

  // Wait for citadel host to write the pointer file
  const pointer = await readHostPointer(15_000);

  return {
    sockPath: pointer.client_sock,
    child,
    kill: () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // already gone
      }
    },
  };
};

export const spawnGuest = async (opts: GuestOptions): Promise<SpawnedSession> => {
  const args = [
    'connect',
    '--headless',
    '--server',
    opts.server,
    '--name',
    opts.name,
  ];

  // Delete any stale client/current.json so readClientPointer waits for the
  // file written by THIS process, not a leftover from a previous host session.
  await unlink(join(homedir(), '.citadel', 'client', 'current.json')).catch(() => {});

  const child = spawnDetached(args);

  const pointer = await readClientPointer(15_000);

  return {
    sockPath: pointer.client_sock,
    child,
    kill: () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // already gone
      }
    },
  };
};
