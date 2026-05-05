/**
 * The registry is the single source of truth for what dapps can call and
 * how their wc commands map to daemon RPCs. A regression here means a
 * compromised renderer can either bypass the dispatch gate or talk to a
 * service it was never granted access to.
 */
import {
  SCHEMA_COMMANDS,
  applyDefaults,
  bareWcCommand,
  commandsMetadata,
  filterRequestedCommands,
  getCommandByWc,
  getCommandSchema,
  isDappAllowedWcCommand,
  resolveDispatch,
} from './commandRegistry';

describe('registry shape', () => {
  it('every entry with a wcCommand is reachable via getCommandByWc', () => {
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.wcCommand) {
        const entry = getCommandByWc(schema.wcCommand);
        expect(entry?.nsCommand).toBe(ns);
        expect(entry?.schema).toBe(schema);
      }
      for (const alias of schema.aliases ?? []) {
        const entry = getCommandByWc(alias.wcCommand);
        expect(entry?.nsCommand).toBe(ns);
        expect(entry?.schema).toBe(schema);
      }
    }
  });

  it('wcCommand values are unique across all entries (including aliases)', () => {
    const seen = new Map<string, string>();
    const claim = (wcCommand: string, ns: string) => {
      if (seen.has(wcCommand)) {
        throw new Error(`duplicate wcCommand "${wcCommand}" on ${ns} and ${seen.get(wcCommand)}`);
      }
      seen.set(wcCommand, ns);
    };
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.wcCommand) claim(schema.wcCommand, ns);
      for (const alias of schema.aliases ?? []) claim(alias.wcCommand, ns);
    }
  });

  it('every wcCommand uses wire form (`chia_<name>`)', () => {
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.wcCommand) {
        expect(schema.wcCommand.startsWith('chia_')).toBe(true);
        expect(schema.wcCommand.length).toBeGreaterThan('chia_'.length);
      }
      for (const alias of schema.aliases ?? []) {
        expect(alias.wcCommand.startsWith('chia_')).toBe(true);
        expect(alias.wcCommand.length).toBeGreaterThan('chia_'.length);
      }
    }
  });

  it('every nsCommand is "service.command" with non-empty parts', () => {
    for (const ns of SCHEMA_COMMANDS) {
      const dot = ns.indexOf('.');
      expect(dot).toBeGreaterThan(0);
      expect(ns.slice(0, dot)).not.toBe('');
      expect(ns.slice(dot + 1)).not.toBe('');
    }
  });
});

describe('isDappAllowedWcCommand', () => {
  it('returns true for renderer-handled meta-commands', () => {
    expect(isDappAllowedWcCommand('chia_requestPermissions')).toBe(true);
    expect(isDappAllowedWcCommand('chia_showNotification')).toBe(true);
  });

  it('returns true for dispatchable wc commands (wire form)', () => {
    expect(isDappAllowedWcCommand('chia_sendTransaction')).toBe(true);
    expect(isDappAllowedWcCommand('chia_spendCAT')).toBe(true);
    expect(isDappAllowedWcCommand('chia_createOfferForIds')).toBe(true);
    expect(isDappAllowedWcCommand('chia_signMessageByAddress')).toBe(true);
    expect(isDappAllowedWcCommand('chia_getWallets')).toBe(true);
    expect(isDappAllowedWcCommand('chia_getNFTInfo')).toBe(true);
  });

  it('returns false for unknown / UI-only / wrong-form commands', () => {
    expect(isDappAllowedWcCommand('chia_totallyMadeUp')).toBe(false);
    expect(isDappAllowedWcCommand('')).toBe(false);
    // Bare form (without `chia_` prefix) is not the registry shape — the
    // wire-form expectation pins this.
    expect(isDappAllowedWcCommand('sendTransaction')).toBe(false);
  });
});

describe('resolveDispatch', () => {
  it('resolves a known wcCommand to destination + bare command + nsCommand', () => {
    expect(resolveDispatch('chia_sendTransaction')).toEqual({
      ok: true,
      destination: 'chia_wallet',
      command: 'send_transaction',
      nsCommand: 'chia_wallet.send_transaction',
    });
  });

  it('handles acronym-bearing names that cannot be auto-derived', () => {
    expect(resolveDispatch('chia_spendCAT')).toEqual({
      ok: true,
      destination: 'chia_wallet',
      command: 'cat_spend',
      nsCommand: 'chia_wallet.cat_spend',
    });
    expect(resolveDispatch('chia_getNFTInfo')).toEqual({
      ok: true,
      destination: 'chia_wallet',
      command: 'nft_get_info',
      nsCommand: 'chia_wallet.nft_get_info',
    });
    expect(resolveDispatch('chia_setDIDName')).toEqual({
      ok: true,
      destination: 'chia_wallet',
      command: 'did_set_wallet_name',
      nsCommand: 'chia_wallet.did_set_wallet_name',
    });
  });

  it('routes DataLayer commands to chia_data_layer', () => {
    expect(resolveDispatch('chia_createDataStore')).toMatchObject({
      ok: true,
      destination: 'chia_data_layer',
      command: 'create_data_store',
    });
    expect(resolveDispatch('chia_cancelDataLayerOffer')).toMatchObject({
      ok: true,
      destination: 'chia_data_layer',
      command: 'cancel_offer',
    });
  });

  it('routes daemon-namespace commands correctly', () => {
    expect(resolveDispatch('chia_getPublicKey')).toMatchObject({
      ok: true,
      destination: 'daemon',
      command: 'get_public_key',
    });
    expect(resolveDispatch('chia_getWalletAddresses')).toMatchObject({
      ok: true,
      destination: 'daemon',
      command: 'get_wallet_addresses',
    });
  });

  it('rejects unknown wc commands', () => {
    expect(resolveDispatch('chia_totallyMadeUp')).toEqual({
      ok: false,
      reason: 'unknown wc command: chia_totallyMadeUp',
    });
  });

  it('rejects renderer-handled meta-commands routed through dispatch', () => {
    expect(resolveDispatch('chia_requestPermissions')).toEqual({
      ok: false,
      reason: 'wc command not dispatchable: chia_requestPermissions',
    });
    expect(resolveDispatch('chia_showNotification')).toEqual({
      ok: false,
      reason: 'wc command not dispatchable: chia_showNotification',
    });
  });

  it('routes the legacy `chia_getCurrentAddress` alias to `get_next_address`', () => {
    // The daemon has no `get_current_address` RPC; dispatching the legacy
    // wcCommand to a fabricated `chia_wallet.get_current_address` would
    // come back as `unknown_command get_current_address`. The alias on
    // `chia_wallet.get_next_address` is what makes this work.
    expect(resolveDispatch('chia_getCurrentAddress')).toEqual({
      ok: true,
      destination: 'chia_wallet',
      command: 'get_next_address',
      nsCommand: 'chia_wallet.get_next_address',
    });
  });
});

describe('getCommandByWc', () => {
  it('returns ns + schema for a known wcCommand', () => {
    const result = getCommandByWc('chia_sendTransaction');
    expect(result?.nsCommand).toBe('chia_wallet.send_transaction');
    expect(result?.schema.wcCommand).toBe('chia_sendTransaction');
  });

  it('returns ns + schema for a renderer-handled meta-command', () => {
    const result = getCommandByWc('chia_requestPermissions');
    expect(result?.nsCommand).toBe('chia_app.request_permissions');
  });

  it('returns the parent ns + schema for an alias wcCommand', () => {
    // `chia_getCurrentAddress` is an alias of `chia_wallet.get_next_address`
    // with `new_address: false`. The daemon-side dispatch must land on the
    // real RPC, not the legacy `get_current_address` (which the daemon
    // rejects with "unknown_command get_current_address").
    const result = getCommandByWc('chia_getCurrentAddress');
    expect(result?.nsCommand).toBe('chia_wallet.get_next_address');
    expect(result?.defaults).toEqual({ wallet_id: 1, new_address: false });
  });

  it('returns undefined for unknown commands', () => {
    expect(getCommandByWc('chia_definitelyNotReal')).toBeUndefined();
  });
});

describe('filterRequestedCommands', () => {
  it('returns empty lists for an empty input', () => {
    expect(filterRequestedCommands([])).toEqual({ allowed: [], rejected: [] });
  });

  it('partitions wire-form names by registry membership (no slicing)', () => {
    const result = filterRequestedCommands(['chia_sendTransaction', 'chia_getWallets', 'chia_totallyMadeUp']);
    expect(result.allowed.sort()).toEqual(['chia_getWallets', 'chia_sendTransaction']);
    expect(result.rejected).toEqual(['chia_totallyMadeUp']);
  });

  it('rejects bare-form names (forces wire-form discipline)', () => {
    // A renderer that forgot to prefix is a bug — surface it loudly rather
    // than silently grant access.
    const result = filterRequestedCommands(['sendTransaction']);
    expect(result.allowed).toEqual([]);
    expect(result.rejected).toEqual(['sendTransaction']);
  });

  it('drops methods outside the chia_ namespace into rejected (still string match)', () => {
    // Other-namespace methods aren't WC chia methods at all. The registry
    // doesn't know them so they end up in `rejected`.
    const result = filterRequestedCommands(['eip155_personal_sign', 'cosmos_signDirect', 'chia_sendTransaction']);
    expect(result.allowed).toEqual(['chia_sendTransaction']);
    expect(result.rejected.sort()).toEqual(['cosmos_signDirect', 'eip155_personal_sign']);
  });

  it('deduplicates repeated method names', () => {
    const result = filterRequestedCommands([
      'chia_sendTransaction',
      'chia_sendTransaction',
      'chia_madeUp',
      'chia_madeUp',
    ]);
    expect(result.allowed).toEqual(['chia_sendTransaction']);
    expect(result.rejected).toEqual(['chia_madeUp']);
  });

  it('ignores non-string entries', () => {
    const result = filterRequestedCommands([
      'chia_sendTransaction',
      // @ts-expect-error - exercising defensive runtime check
      null,
      // @ts-expect-error
      42,
    ]);
    expect(result.allowed).toEqual(['chia_sendTransaction']);
    expect(result.rejected).toEqual([]);
  });

  it('drops empty-string entries', () => {
    expect(filterRequestedCommands([''])).toEqual({ allowed: [], rejected: [] });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['object literal', { 0: 'chia_sendTransaction' }],
    ['number', 42],
    ['string', 'chia_sendTransaction'],
  ])('returns empty lists when requestedCommands is %s (defensive against IPC garbage)', (_label, val) => {
    expect(filterRequestedCommands(val as unknown)).toEqual({ allowed: [], rejected: [] });
  });

  it('keeps renderer-handled meta-commands so the WC SDK accepts them at session approval', () => {
    const result = filterRequestedCommands(['chia_requestPermissions', 'chia_showNotification']);
    expect(result.allowed.sort()).toEqual(['chia_requestPermissions', 'chia_showNotification']);
    expect(result.rejected).toEqual([]);
  });

  it('orchestration-only commands (createNewDIDWallet, transferDID, addCATToken) are filtered out', () => {
    const result = filterRequestedCommands(['chia_createNewDIDWallet', 'chia_transferDID', 'chia_addCATToken']);
    expect(result.allowed).toEqual([]);
    expect(result.rejected.sort()).toEqual(['chia_addCATToken', 'chia_createNewDIDWallet', 'chia_transferDID']);
  });
});

describe('commandsMetadata', () => {
  // The renderer's `useCommandMetadata` hook depends on this snapshot
  // shape. Catches accidental field renames and verifies that every
  // dispatchable command has a label (Settings UI would otherwise show a
  // bare wcCommand string).
  const snapshot = commandsMetadata();
  const byWc = new Map(snapshot.map((m) => [m.wcCommand, m]));

  it('returns an entry for every schema wcCommand and every alias (no orphans)', () => {
    let expected = 0;
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.wcCommand) expected += 1;
      expected += schema.aliases?.length ?? 0;
    }
    expect(snapshot.length).toBe(expected);
  });

  it('includes the renderer-handled meta-commands so the Settings UI can label them', () => {
    expect(byWc.get('chia_requestPermissions')?.label).toBe('Request Permissions');
    expect(byWc.get('chia_showNotification')?.label).toBeDefined();
  });

  it('includes alias wcCommands (chia_getCurrentAddress) so Settings can render them', () => {
    // Without the alias being surfaced in metadata, the Settings UI would
    // show a bare wcCommand string for any dapp that lists getCurrentAddress
    // among its proposal methods.
    const entry = byWc.get('chia_getCurrentAddress');
    expect(entry).toBeDefined();
    expect(entry?.requiresSync).toBe(false);
  });

  it('resolves label and description strings (i18n call happened at fetch time)', () => {
    const sendTx = byWc.get('chia_sendTransaction');
    expect(sendTx?.label).toBe('Send Transaction');
    // description may be undefined for some commands that have no description in the schema
    expect(typeof sendTx?.label).toBe('string');
  });

  it('flags `requiresSync: true` on the four spend-class commands', () => {
    expect(byWc.get('chia_sendTransaction')?.requiresSync).toBe(true);
    expect(byWc.get('chia_spendCAT')?.requiresSync).toBe(true);
    expect(byWc.get('chia_spendClawbackCoins')?.requiresSync).toBe(true);
    expect(byWc.get('chia_getSpendableCoins')?.requiresSync).toBe(true);
  });

  it('defaults `requiresSync: false` on every other command', () => {
    expect(byWc.get('chia_getWallets')?.requiresSync).toBe(false);
    expect(byWc.get('chia_signMessageByAddress')?.requiresSync).toBe(false);
    expect(byWc.get('chia_takeOffer')?.requiresSync).toBe(false);
  });
});

describe('applyDefaults', () => {
  // The wire envelope has to carry `wallet_id: 1` (and a few similar defaults)
  // for daemon RPCs that require it but that dapps conventionally omit.
  // Without these, those commands silently fail at the daemon. Keyed by
  // wcCommand so aliases that share an nsCommand (e.g. getCurrentAddress
  // vs getNextAddress) can pin different defaults.

  it('fills in `wallet_id: 1` for chia_sendTransaction when omitted', () => {
    const out = applyDefaults('chia_sendTransaction', {
      address: 'txch1abc',
      amount: '5',
      fee: '0',
    });
    expect(out.wallet_id).toBe(1);
  });

  it('does not overwrite a wallet_id the dapp explicitly sent', () => {
    const out = applyDefaults('chia_sendTransaction', {
      wallet_id: 7,
      address: 'txch1abc',
      amount: '5',
    });
    expect(out.wallet_id).toBe(7);
  });

  it('returns the input unchanged when the schema has no defaults', () => {
    const input = { address: 'txch1abc', amount: '5' };
    const out = applyDefaults('chia_cancelOffer', input);
    expect(out).toEqual(input);
  });

  it('returns the input unchanged for unknown wc commands', () => {
    const input = { foo: 'bar' };
    const out = applyDefaults('chia_totallyMadeUp', input);
    expect(out).toEqual(input);
  });

  it('does not mutate the input object (returns a new one when defaults apply)', () => {
    const input: Record<string, unknown> = { address: 'txch1abc' };
    applyDefaults('chia_sendTransaction', input);
    expect(input.wallet_id).toBeUndefined();
  });

  it('applies multiple defaults at once (chia_getNextAddress)', () => {
    const out = applyDefaults('chia_getNextAddress', {});
    expect(out.wallet_id).toBe(1);
    expect(out.new_address).toBe(true);
  });

  it('treats explicit `false` / `0` / empty string as set (does not overwrite)', () => {
    // `applyDefaults` only fills `undefined` keys — falsy non-undefined values
    // should pass through unchanged so a dapp can opt out of a default.
    const out = applyDefaults('chia_getNextAddress', { new_address: false });
    expect(out.new_address).toBe(false);
  });

  it('alias pins its own default (chia_getCurrentAddress → new_address: false)', () => {
    // The Chia daemon has no `get_current_address` RPC. The legacy WC alias
    // routes to `chia_wallet.get_next_address` with `new_address: false`,
    // matching the api-react shim. Without per-alias defaults, the base
    // schema would flip `new_address` to `true` and the dapp would silently
    // get a fresh address on every call.
    const out = applyDefaults('chia_getCurrentAddress', {});
    expect(out.wallet_id).toBe(1);
    expect(out.new_address).toBe(false);
  });

  it('alias still lets the dapp opt out of the alias default', () => {
    const out = applyDefaults('chia_getCurrentAddress', { new_address: true });
    expect(out.new_address).toBe(true);
  });
});

describe('bareWcCommand', () => {
  it('strips the chia_ prefix', () => {
    expect(bareWcCommand('chia_sendTransaction')).toBe('sendTransaction');
    expect(bareWcCommand('chia_getNFTInfo')).toBe('getNFTInfo');
  });

  it('passes already-bare names through unchanged', () => {
    expect(bareWcCommand('sendTransaction')).toBe('sendTransaction');
  });

  it('handles the empty string', () => {
    expect(bareWcCommand('')).toBe('');
  });
});
