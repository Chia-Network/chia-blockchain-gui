// JSON-RPC 2.0 + WalletConnect SDK error codes the wallet returns to dapps.
// Codes verified against `@walletconnect/utils` v2.23.9 (`getSdkError`).
export const WcErrorCode = {
  /** JSON-RPC 2.0 — method does not exist. */
  METHOD_NOT_FOUND: -32601,
  /** JSON-RPC 2.0 — invalid method parameters. */
  INVALID_PARAMS: -32602,
  /** JSON-RPC 2.0 — internal wallet error. */
  INTERNAL_ERROR: -32603,
  /** WC SDK — pair did not grant the method. */
  UNAUTHORIZED_METHOD: 3001,
  /** WC SDK — user explicitly rejected the request. */
  USER_REJECTED: 5000,
  /** WC SDK — chain does not match the pair. */
  UNSUPPORTED_CHAINS: 5100,
} as const;

export type WcErrorCodeValue = (typeof WcErrorCode)[keyof typeof WcErrorCode];

export class WcError extends Error {
  readonly code: number;

  /**
   * Forwarded to the JSON-RPC `error.data` field. Lets daemon application
   * errors survive clients that canonicalize `message` by code (many JSON-RPC
   * libraries display "Internal error" for `-32603` and only expose the real
   * payload through `error.data`).
   */
  readonly data?: unknown;

  constructor(message: string, code: number, options?: { data?: unknown }) {
    super(message);
    this.name = 'WcError';
    this.code = code;
    if (options && 'data' in options) this.data = options.data;
    // Keep instanceof working when transpiled to ES5.
    Object.setPrototypeOf(this, WcError.prototype);
  }
}

// Electron IPC strips custom Error properties — only `message` survives, and
// it gets wrapped: a `new Error('[wc:5000] foo')` thrown from main shows up
// in the renderer as `Error invoking remote method 'X': Error: [wc:5000] foo`.
// The decode regex looks for the `[wc:CODE]` prefix (with an optional
// `|<base64>` data segment) anywhere in the wrapped message and captures
// everything after it.
const IPC_PREFIX_RE = /\[wc:(-?\d+)(?:\|([A-Za-z0-9+/=]*))?\]\s*([\s\S]*)$/;

function encodeData(data: unknown): string {
  // base64 keeps the prefix ASCII-safe and free of `]`, which would confuse
  // the decoder. JSON.stringify of arbitrary values can produce `undefined`
  // (e.g. for a bare `undefined`), in which case we treat it as "no data".
  const json = JSON.stringify(data);
  if (json === undefined) return '';
  // Buffer is available in both Node (main) and Electron renderer contexts.
  return Buffer.from(json, 'utf8').toString('base64');
}

function decodeData(b64: string): unknown {
  if (!b64) return undefined;
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    // Malformed payload — don't crash the error path; just drop `data`.
    return undefined;
  }
}

export function encodeWcErrorForIpc(error: unknown): string {
  if (error instanceof WcError) {
    const dataSegment = error.data !== undefined ? encodeData(error.data) : '';
    const prefix = dataSegment ? `[wc:${error.code}|${dataSegment}]` : `[wc:${error.code}]`;
    return `${prefix} ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Returns a WcError when the message carries the IPC prefix; undefined otherwise. */
export function decodeWcErrorFromIpc(message: string): WcError | undefined {
  const match = IPC_PREFIX_RE.exec(message);
  if (!match) return undefined;
  const [, codeStr, b64, msg] = match;
  const data = b64 ? decodeData(b64) : undefined;
  return new WcError(msg, Number(codeStr), data !== undefined ? { data } : undefined);
}
