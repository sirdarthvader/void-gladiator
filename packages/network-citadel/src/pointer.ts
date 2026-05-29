/**
 * Reads citadel session pointer files.
 * Polls until the file appears (citadel writes it after WaitForSentinel).
 * Reference: docs/decisions/0006-session-pointer-files.md in citadel repo.
 */

import { readFile, access } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const POLL_MS = 200;

export interface HostPointer {
  server_sock: string;
  server_pid: number;
  server_name: string;
  client_sock: string;
  client_pid: number;
  my_name: string;
  started_at: string;
}

export interface ClientPointer {
  client_sock: string;
  client_pid: number;
  server_addr: string;
  server_name: string;
  my_name: string;
  started_at: string;
}

const citadelDir = (): string => join(homedir(), '.citadel');

const readJSON = async <T>(path: string): Promise<T> => {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
};

const pollUntilExists = async (
  path: string,
  timeoutMs: number
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await access(path);
      return;
    } catch {
      await sleep(POLL_MS);
    }
  }
  throw new Error(`timed out waiting for ${path}`);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export const readHostPointer = async (
  timeoutMs = 15_000
): Promise<HostPointer> => {
  const path = join(citadelDir(), 'host', 'current.json');
  await pollUntilExists(path, timeoutMs);
  return readJSON<HostPointer>(path);
};

/** Read host/current.json once without polling. Returns null if absent. */
export const tryReadHostPointer = async (): Promise<HostPointer | null> => {
  const path = join(citadelDir(), 'host', 'current.json');
  try {
    return await readJSON<HostPointer>(path);
  } catch {
    return null;
  }
};

export const readClientPointer = async (
  timeoutMs = 15_000
): Promise<ClientPointer> => {
  const path = join(citadelDir(), 'client', 'current.json');
  await pollUntilExists(path, timeoutMs);
  return readJSON<ClientPointer>(path);
};
