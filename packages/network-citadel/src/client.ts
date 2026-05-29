/**
 * CitadelClient — connects to a citadel control plane over UDS and
 * exposes a simple event-emitter interface for the game to consume.
 */

import { createConnection, type Socket } from 'net';
import { EventEmitter } from 'events';
import { encodeFrame, FrameDecoder } from './frame.js';
import { isEv, type Ev, type Op } from './codec.js';

export interface CitadelClientEvents {
  event: (ev: Ev) => void;
  close: () => void;
  error: (err: Error) => void;
}

export class CitadelClient extends EventEmitter {
  private socket: Socket | null = null;
  private decoder = new FrameDecoder();
  private sockPath: string;
  private closed = false;

  constructor(sockPath: string) {
    super();
    this.sockPath = sockPath;
  }

  dial(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sock = createConnection({ path: this.sockPath });
      this.socket = sock;

      const onConnect = (): void => {
        sock.removeListener('error', onConnectError);
        resolve();
      };
      const onConnectError = (err: Error): void => {
        sock.removeListener('connect', onConnect);
        reject(err);
      };

      sock.once('connect', onConnect);
      sock.once('error', onConnectError);

      sock.on('data', (chunk: Buffer) => {
        this.decoder.feed(chunk);
        for (const msg of this.decoder.drain()) {
          if (isEv(msg)) {
            this.emit('event', msg);
          }
        }
      });

      sock.on('close', () => {
        if (!this.closed) {
          this.closed = true;
          this.emit('close');
        }
      });

      sock.on('error', (err: Error) => {
        if (!this.closed) {
          this.emit('error', err);
        }
      });
    });
  }

  send(op: Op): void {
    if (!this.socket || this.closed) return;
    try {
      this.socket.write(encodeFrame(op));
    } catch {
      // socket gone — ignore, close event will fire
    }
  }

  subscribe(level: 'summary' | 'full' = 'full', since = 0): void {
    this.send({ op: 'subscribe', level, since });
  }

  subscribeGame(): void {
    this.send({ op: 'subscribe-game' });
  }

  unsubscribeGame(): void {
    this.send({ op: 'unsubscribe-game' });
  }

  sendChat(text: string): void {
    this.send({ op: 'send-chat', text, to: '' });
  }

  sendGame(kind: string, data: unknown, to = ''): void {
    this.send({ op: 'send-game', kind, to, data });
  }

  listPeers(): void {
    this.send({ op: 'list-peers' });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.socket?.destroy();
  }
}
