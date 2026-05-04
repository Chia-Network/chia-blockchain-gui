/**
 * `getAvailableWallets` is the daemon-sourced wallet list for the Pair
 * dialog. Trust boundary: the renderer used to supply this and could lie
 * about which keys exist or which is active. These tests pin the
 * branches that determine what the dialog gets.
 */

jest.mock('./sendCommand');

import sendCommand from './sendCommand';

import getAvailableWallets from './getAvailableWallets';

const mockSendCommand = sendCommand as jest.MockedFunction<typeof sendCommand>;

beforeEach(() => {
  mockSendCommand.mockReset();
});

function arrangeKeysAndFingerprint(
  keys: { fingerprint: number; label?: string }[] | undefined,
  loggedIn: number | undefined | { throws: Error },
) {
  mockSendCommand.mockImplementation(async (command, destination) => {
    if (command === 'get_keys' && destination === 'daemon') {
      return { keys } as Record<string, unknown>;
    }
    if (command === 'get_logged_in_fingerprint' && destination === 'chia_wallet') {
      if (loggedIn && typeof loggedIn === 'object' && 'throws' in loggedIn) {
        throw loggedIn.throws;
      }
      return { fingerprint: loggedIn } as Record<string, unknown>;
    }
    throw new Error(`unexpected sendCommand: ${command} → ${destination}`);
  });
}

describe('getAvailableWallets — happy path', () => {
  it('maps daemon keys to PairWalletOption with fingerprint + label', async () => {
    arrangeKeysAndFingerprint(
      [
        { fingerprint: 111, label: 'Main' },
        { fingerprint: 222, label: 'Cold' },
      ],
      111,
    );
    const result = await getAvailableWallets();
    expect(result.availableWallets).toEqual([
      { fingerprint: 111, name: 'Main' },
      { fingerprint: 222, name: 'Cold' },
    ]);
  });

  it('defaults to the logged-in fingerprint when it appears in the keys list', async () => {
    arrangeKeysAndFingerprint(
      [
        { fingerprint: 111, label: 'A' },
        { fingerprint: 222, label: 'B' },
      ],
      222,
    );
    const result = await getAvailableWallets();
    expect(result.defaultFingerprints).toEqual([222]);
  });

  it('drops the default when the logged-in fingerprint is not on the keys list', async () => {
    // Edge case: the daemon's logged-in fingerprint is technically possible
    // to be a key the wallet doesn't expose. Don't pre-select something the
    // user can't actually pick.
    arrangeKeysAndFingerprint([{ fingerprint: 111 }], 999);
    const result = await getAvailableWallets();
    expect(result.defaultFingerprints).toEqual([]);
  });
});

describe('getAvailableWallets — empty / missing labels', () => {
  it('returns empty wallets and empty defaults when the daemon has no keys', async () => {
    arrangeKeysAndFingerprint([], 111);
    const result = await getAvailableWallets();
    expect(result.availableWallets).toEqual([]);
    expect(result.defaultFingerprints).toEqual([]);
  });

  it('omits `name` when label is empty string (treats falsy label as absent)', async () => {
    arrangeKeysAndFingerprint([{ fingerprint: 111, label: '' }], 111);
    const result = await getAvailableWallets();
    expect(result.availableWallets[0]).toEqual({ fingerprint: 111, name: undefined });
  });

  it('omits `name` when label field is missing entirely', async () => {
    arrangeKeysAndFingerprint([{ fingerprint: 111 }], 111);
    const result = await getAvailableWallets();
    expect(result.availableWallets[0]).toEqual({ fingerprint: 111, name: undefined });
  });

  it('treats an undefined `keys` field on the response as empty', async () => {
    // Daemon contract is `{ keys: [...] }` but a hardened reader handles
    // a missing field — never crash the pair flow on a daemon-shape change.
    arrangeKeysAndFingerprint(undefined, 111);
    const result = await getAvailableWallets();
    expect(result.availableWallets).toEqual([]);
    expect(result.defaultFingerprints).toEqual([]);
  });
});

describe('getAvailableWallets — fingerprint resolution', () => {
  it('drops the default when the daemon returns no logged-in fingerprint', async () => {
    arrangeKeysAndFingerprint([{ fingerprint: 111 }], undefined);
    const result = await getAvailableWallets();
    expect(result.defaultFingerprints).toEqual([]);
  });

  it('drops the default when the logged-in fingerprint comes back as a non-number', async () => {
    mockSendCommand.mockImplementation(async (command) => {
      if (command === 'get_keys') return { keys: [{ fingerprint: 111 }] };
      return { fingerprint: 'not-a-number' };
    });
    const result = await getAvailableWallets();
    expect(result.defaultFingerprints).toEqual([]);
  });

  it('tolerates a `get_logged_in_fingerprint` failure (still returns wallets)', async () => {
    // Default selection is a UX nicety; without it the dialog still opens.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    arrangeKeysAndFingerprint([{ fingerprint: 111 }], { throws: new Error('rpc down') });
    const result = await getAvailableWallets();
    expect(result.availableWallets).toEqual([{ fingerprint: 111, name: undefined }]);
    expect(result.defaultFingerprints).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('getAvailableWallets — failure modes', () => {
  it('propagates a `get_keys` failure (pair flow must fail visibly)', async () => {
    // Without keys the dialog has nothing to render — surface the error
    // rather than open an empty list.
    mockSendCommand.mockRejectedValueOnce(new Error('daemon unreachable'));
    await expect(getAvailableWallets()).rejects.toThrow('daemon unreachable');
  });

  it('does not call `get_logged_in_fingerprint` if `get_keys` fails', async () => {
    mockSendCommand.mockRejectedValueOnce(new Error('boom'));
    await expect(getAvailableWallets()).rejects.toThrow();
    // Only one call was made — the failure short-circuits.
    expect(mockSendCommand).toHaveBeenCalledTimes(1);
  });
});
