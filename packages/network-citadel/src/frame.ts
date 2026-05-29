/**
 * 4-byte big-endian length-prefix framing for citadel's control protocol.
 * Mirrors internal/proto/frame.go in the citadel repo.
 */

const HEADER_SIZE = 4;
const MAX_PAYLOAD = 64 * 1024;

/**
 * Encode a JSON object into a length-prefixed frame.
 */
export const encodeFrame = (obj: unknown): Buffer => {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8');
  if (payload.length > MAX_PAYLOAD) {
    throw new Error(`frame payload too large: ${payload.length} bytes`);
  }
  const frame = Buffer.allocUnsafe(HEADER_SIZE + payload.length);
  frame.writeUInt32BE(payload.length, 0);
  payload.copy(frame, HEADER_SIZE);
  return frame;
};

/**
 * Stateful incremental frame decoder.
 * Feed raw socket data chunks; pull complete JSON objects via next().
 */
export class FrameDecoder {
  private buf = Buffer.alloc(0);

  feed(chunk: Buffer): void {
    this.buf = Buffer.concat([this.buf, chunk]);
  }

  next(): unknown | null {
    if (this.buf.length < HEADER_SIZE) return null;
    const len = this.buf.readUInt32BE(0);
    if (len > MAX_PAYLOAD) {
      throw new Error(`frame length ${len} exceeds max ${MAX_PAYLOAD}`);
    }
    if (this.buf.length < HEADER_SIZE + len) return null;
    const payload = this.buf.subarray(HEADER_SIZE, HEADER_SIZE + len);
    this.buf = this.buf.subarray(HEADER_SIZE + len);
    return JSON.parse(payload.toString('utf8'));
  }

  *drain(): Iterable<unknown> {
    let msg: unknown | null;
    while ((msg = this.next()) !== null) {
      yield msg;
    }
  }
}
