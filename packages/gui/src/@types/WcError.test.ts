import { WcError, WcErrorCode, decodeWcErrorFromIpc, encodeWcErrorForIpc } from './WcError';

describe('WcError', () => {
  it('preserves message and code', () => {
    const e = new WcError('boom', WcErrorCode.UNAUTHORIZED_METHOD);
    expect(e.message).toBe('boom');
    expect(e.code).toBe(3001);
    expect(e.name).toBe('WcError');
  });

  it('instanceof Error and instanceof WcError both work after transpile', () => {
    const e = new WcError('x', -32_602);
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(WcError);
  });

  it('exposes the JSON-RPC + WC SDK code constants we use on the wire', () => {
    // Sanity: the values are what the spec / @walletconnect/utils define.
    expect(WcErrorCode.METHOD_NOT_FOUND).toBe(-32_601);
    expect(WcErrorCode.INVALID_PARAMS).toBe(-32_602);
    expect(WcErrorCode.INTERNAL_ERROR).toBe(-32_603);
    expect(WcErrorCode.UNAUTHORIZED_METHOD).toBe(3001);
    expect(WcErrorCode.USER_REJECTED).toBe(5000);
    expect(WcErrorCode.UNSUPPORTED_CHAINS).toBe(5100);
  });
});

describe('encodeWcErrorForIpc / decodeWcErrorFromIpc', () => {
  // Electron IPC strips Error prototype info — the prefix smuggles the code
  // across as part of the (preserved) message string.

  it('round-trips a WcError', () => {
    const original = new WcError('User rejected', WcErrorCode.USER_REJECTED);
    const decoded = decodeWcErrorFromIpc(encodeWcErrorForIpc(original));
    expect(decoded?.code).toBe(WcErrorCode.USER_REJECTED);
    expect(decoded?.message).toBe('User rejected');
  });

  it('preserves multi-line messages (real-world stack-style payloads)', () => {
    const original = new WcError('line1\nline2', WcErrorCode.INTERNAL_ERROR);
    const decoded = decodeWcErrorFromIpc(encodeWcErrorForIpc(original));
    expect(decoded?.message).toBe('line1\nline2');
    expect(decoded?.code).toBe(WcErrorCode.INTERNAL_ERROR);
  });

  it('encodes a plain Error as just the message (no prefix)', () => {
    const encoded = encodeWcErrorForIpc(new Error('plain'));
    expect(encoded).toBe('plain');
    expect(decodeWcErrorFromIpc(encoded)).toBeUndefined();
  });

  it('encodes a non-Error value via String()', () => {
    expect(encodeWcErrorForIpc('raw string')).toBe('raw string');
    expect(encodeWcErrorForIpc(42)).toBe('42');
    expect(encodeWcErrorForIpc(undefined)).toBe('undefined');
  });

  it('decode returns undefined when no wc-prefix is present', () => {
    expect(decodeWcErrorFromIpc('no prefix here')).toBeUndefined();
    expect(decodeWcErrorFromIpc('[notwc:5000] x')).toBeUndefined();
    expect(decodeWcErrorFromIpc('')).toBeUndefined();
  });

  it('decode tolerates missing space after the prefix', () => {
    const decoded = decodeWcErrorFromIpc('[wc:5000]boom');
    expect(decoded?.code).toBe(5000);
    expect(decoded?.message).toBe('boom');
  });

  it('decode handles negative codes (JSON-RPC range)', () => {
    const decoded = decodeWcErrorFromIpc('[wc:-32602] bad params');
    expect(decoded?.code).toBe(-32_602);
    expect(decoded?.message).toBe('bad params');
  });

  it('decode finds the prefix when Electron wraps the message with "Error invoking remote method"', () => {
    // Real-world shape: when a main-side IPC handler throws, the renderer's
    // caught Error has a message like "Error invoking remote method 'X': Error: [wc:N] msg".
    // The decoder must match the prefix anywhere, not only at the start.
    const wrapped =
      "Error invoking remote method 'permissions:dispatchAsPair': Error: [wc:-32602] param not allowed for dapp: fingerprint";
    const decoded = decodeWcErrorFromIpc(wrapped);
    expect(decoded?.code).toBe(-32_602);
    expect(decoded?.message).toBe('param not allowed for dapp: fingerprint');
  });
});
