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

  constructor(message: string, code: number) {
    super(message);
    this.name = 'WcError';
    this.code = code;
    // Keep instanceof working when transpiled to ES5.
    Object.setPrototypeOf(this, WcError.prototype);
  }
}

// Electron IPC strips custom Error properties — only `message` survives, and
// it gets wrapped: a `new Error('[wc:5000] foo')` thrown from main shows up
// in the renderer as `Error invoking remote method 'X': Error: [wc:5000] foo`.
// The decode regex looks for the `[wc:CODE]` prefix anywhere in the wrapped
// message and captures everything after it.
const IPC_PREFIX_RE = /\[wc:(-?\d+)\]\s*([\s\S]*)$/;

export function encodeWcErrorForIpc(error: unknown): string {
  if (error instanceof WcError) return `[wc:${error.code}] ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Returns a WcError when the message carries the IPC prefix; undefined otherwise. */
export function decodeWcErrorFromIpc(message: string): WcError | undefined {
  const match = IPC_PREFIX_RE.exec(message);
  if (!match) return undefined;
  return new WcError(match[2], Number(match[1]));
}
