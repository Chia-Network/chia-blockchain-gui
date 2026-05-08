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

describe('encodeWcErrorForIpc / decodeWcErrorFromIpc — data field', () => {
  // The optional `data` segment forwards the JSON-RPC `error.data` so dapp
  // clients that canonicalize `message` by code can still surface the real
  // daemon payload. Encoded as `[wc:CODE|<base64-of-JSON>] msg`.

  it('round-trips a structured object payload', () => {
    const original = new WcError("Coin ID's not found", WcErrorCode.INTERNAL_ERROR, {
      data: { success: false, error: "Coin ID's not found", details: { tries: 3 } },
    });
    const decoded = decodeWcErrorFromIpc(encodeWcErrorForIpc(original));
    expect(decoded?.code).toBe(WcErrorCode.INTERNAL_ERROR);
    expect(decoded?.message).toBe("Coin ID's not found");
    expect(decoded?.data).toEqual({ success: false, error: "Coin ID's not found", details: { tries: 3 } });
  });

  it('round-trips an array payload', () => {
    const original = new WcError('boom', WcErrorCode.INVALID_PARAMS, { data: ['a', 'b', 1, true] });
    const decoded = decodeWcErrorFromIpc(encodeWcErrorForIpc(original));
    expect(decoded?.data).toEqual(['a', 'b', 1, true]);
  });

  it('round-trips a primitive payload', () => {
    const original = new WcError('boom', WcErrorCode.INTERNAL_ERROR, { data: 42 });
    const decoded = decodeWcErrorFromIpc(encodeWcErrorForIpc(original));
    expect(decoded?.data).toBe(42);
  });

  it('omits the data segment when the WcError has no data', () => {
    // Backwards-compat shape: existing prefix `[wc:CODE] msg` keeps working.
    const encoded = encodeWcErrorForIpc(new WcError('plain', WcErrorCode.USER_REJECTED));
    expect(encoded).toBe('[wc:5000] plain');
    const decoded = decodeWcErrorFromIpc(encoded);
    expect(decoded?.code).toBe(WcErrorCode.USER_REJECTED);
    expect(decoded?.data).toBeUndefined();
  });

  it('treats `data: undefined` as "no data" (JSON.stringify(undefined) is undefined)', () => {
    const encoded = encodeWcErrorForIpc(new WcError('m', WcErrorCode.INTERNAL_ERROR, { data: undefined }));
    expect(encoded).toBe('[wc:-32603] m');
  });

  it('decodes the wrapped IPC form with a data segment', () => {
    const wrapped = `Error invoking remote method 'permissions:dispatchAsPair': Error: ${encodeWcErrorForIpc(
      new WcError('fee too low', WcErrorCode.INTERNAL_ERROR, { data: { success: false, error: 'fee too low' } }),
    )}`;
    const decoded = decodeWcErrorFromIpc(wrapped);
    expect(decoded?.code).toBe(WcErrorCode.INTERNAL_ERROR);
    expect(decoded?.message).toBe('fee too low');
    expect(decoded?.data).toEqual({ success: false, error: 'fee too low' });
  });

  it('decodes legacy prefix without data segment as no-data', () => {
    const decoded = decodeWcErrorFromIpc('[wc:-32603] m');
    expect(decoded?.code).toBe(-32_603);
    expect(decoded?.data).toBeUndefined();
  });

  it('falls back to no-data on malformed base64 / JSON instead of throwing', () => {
    // Garbage in the data segment must not crash the error path — we'd be
    // dropping the only record of why something failed. Drop `data`, keep msg.
    const decoded = decodeWcErrorFromIpc('[wc:-32603|notvalidbase64==] still has a message');
    expect(decoded?.code).toBe(-32_603);
    expect(decoded?.message).toBe('still has a message');
    expect(decoded?.data).toBeUndefined();
  });

  it('preserves multi-line messages alongside a data segment', () => {
    const original = new WcError('line1\nline2', WcErrorCode.INTERNAL_ERROR, { data: { x: 1 } });
    const decoded = decodeWcErrorFromIpc(encodeWcErrorForIpc(original));
    expect(decoded?.message).toBe('line1\nline2');
    expect(decoded?.data).toEqual({ x: 1 });
  });
});
