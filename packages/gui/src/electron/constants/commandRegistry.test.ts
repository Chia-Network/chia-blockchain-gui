// Registry tests — a regression here means a compromised renderer can
// bypass the dispatch gate or hit a service it wasn't granted.
import { WcError, WcErrorCode } from '../../@types/WcError';

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
  validateDappParams,
} from './commandRegistry';

function captureThrow(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error('expected throw');
}

describe('registry shape', () => {
  it('every entry with a dapp.wcCommand is reachable via getCommandByWc', () => {
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.dapp) {
        const entry = getCommandByWc(schema.dapp.wcCommand);
        expect(entry?.nsCommand).toBe(ns);
        expect(entry?.schema).toBe(schema);
        for (const alias of schema.dapp.aliases ?? []) {
          const aliasEntry = getCommandByWc(alias.wcCommand);
          expect(aliasEntry?.nsCommand).toBe(ns);
          expect(aliasEntry?.schema).toBe(schema);
        }
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
      if (schema.dapp) {
        claim(schema.dapp.wcCommand, ns);
        for (const alias of schema.dapp.aliases ?? []) claim(alias.wcCommand, ns);
      }
    }
  });

  it('every wcCommand uses wire form (`chia_<name>`)', () => {
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.dapp) {
        expect(schema.dapp.wcCommand.startsWith('chia_')).toBe(true);
        expect(schema.dapp.wcCommand.length).toBeGreaterThan('chia_'.length);
        for (const alias of schema.dapp.aliases ?? []) {
          expect(alias.wcCommand.startsWith('chia_')).toBe(true);
          expect(alias.wcCommand.length).toBeGreaterThan('chia_'.length);
        }
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

  /** TODO: please re-enable when we add missing file WalletConnectCommands.tsx
  it('handler-routed commands live under chia_app.* and declare a handlerKey', () => {
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.dapp) {
        if (ns.startsWith('chia_app.')) {
          expect(schema.dapp.handlerKey).toBeDefined();
        } else {
          expect(schema.dapp.handlerKey).toBeUndefined();
        }
      }
    }
  });
  */
});

describe('dappAllowed defaults', () => {
  it('UI-only schemas (no dapp block) leave params unmarked', () => {
    const schema = getCommandSchema('chia_wallet.create_new_wallet');
    expect(schema.dapp).toBeUndefined();
    for (const param of schema.params) {
      expect(param.dappAllowed).toBeUndefined();
    }
  });

  it('every dapp-callable schema has `dappAllowed: true` on every declared param', () => {
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.dapp) {
        for (const param of schema.params) {
          if (param.dappAllowed !== true) {
            throw new Error(
              `Schema ${ns} declares dapp block but param "${param.name}" lacks \`dappAllowed: true\`. ` +
                `Either drop the param from the schema or mark it explicitly.`,
            );
          }
        }
      }
    }
  });
});

describe('isDappAllowedWcCommand', () => {
  it('returns true for handler-routed meta-commands', () => {
    expect(isDappAllowedWcCommand('chia_requestPermissions')).toBe(true);
    expect(isDappAllowedWcCommand('chia_showNotification')).toBe(true);
  });

  it('returns true for handler-routed wallet-flow commands', () => {
    expect(isDappAllowedWcCommand('chia_addCATToken')).toBe(true);
    expect(isDappAllowedWcCommand('chia_transferDID')).toBe(true);
    expect(isDappAllowedWcCommand('chia_createNewDIDWallet')).toBe(true);
  });

  it('returns true for dispatchable wc commands (wire form)', () => {
    expect(isDappAllowedWcCommand('chia_sendTransaction')).toBe(true);
    expect(isDappAllowedWcCommand('chia_spendCAT')).toBe(true);
    expect(isDappAllowedWcCommand('chia_createOfferForIds')).toBe(true);
    expect(isDappAllowedWcCommand('chia_signMessageByAddress')).toBe(true);
    expect(isDappAllowedWcCommand('chia_getWallets')).toBe(true);
    expect(isDappAllowedWcCommand('chia_getNFTInfo')).toBe(true);
    expect(isDappAllowedWcCommand('chia_getFullNodePeerCount')).toBe(true);
  });

  it('returns false for unknown / UI-only / wrong-form commands', () => {
    expect(isDappAllowedWcCommand('chia_totallyMadeUp')).toBe(false);
    expect(isDappAllowedWcCommand('')).toBe(false);
    // Bare form (no `chia_` prefix) is not the registry shape.
    expect(isDappAllowedWcCommand('sendTransaction')).toBe(false);
  });
});

describe('resolveDispatch', () => {
  it('resolves a known wcCommand to destination + bare command + nsCommand', () => {
    expect(resolveDispatch('chia_sendTransaction')).toEqual({
      destination: 'chia_wallet',
      command: 'send_transaction',
      nsCommand: 'chia_wallet.send_transaction',
    });
  });

  it('handles acronym-bearing names that cannot be auto-derived', () => {
    expect(resolveDispatch('chia_spendCAT')).toEqual({
      destination: 'chia_wallet',
      command: 'cat_spend',
      nsCommand: 'chia_wallet.cat_spend',
    });
    expect(resolveDispatch('chia_getNFTInfo')).toEqual({
      destination: 'chia_wallet',
      command: 'nft_get_info',
      nsCommand: 'chia_wallet.nft_get_info',
    });
    expect(resolveDispatch('chia_setDIDName')).toEqual({
      destination: 'chia_wallet',
      command: 'did_set_wallet_name',
      nsCommand: 'chia_wallet.did_set_wallet_name',
    });
  });

  it('resolves chia_getFullNodePeerCount to the wallet RPC', () => {
    expect(resolveDispatch('chia_getFullNodePeerCount')).toEqual({
      destination: 'chia_wallet',
      command: 'get_full_node_peer_count',
      nsCommand: 'chia_wallet.get_full_node_peer_count',
    });
  });

  it('routes DataLayer commands to chia_data_layer', () => {
    expect(resolveDispatch('chia_createDataStore')).toMatchObject({
      destination: 'chia_data_layer',
      command: 'create_data_store',
    });
    expect(resolveDispatch('chia_cancelDataLayerOffer')).toMatchObject({
      destination: 'chia_data_layer',
      command: 'cancel_offer',
    });
  });

  it('routes daemon-namespace commands correctly', () => {
    expect(resolveDispatch('chia_getPublicKey')).toMatchObject({
      destination: 'daemon',
      command: 'get_public_key',
    });
    expect(resolveDispatch('chia_getWalletAddresses')).toMatchObject({
      destination: 'daemon',
      command: 'get_wallet_addresses',
    });
  });

  it('throws WcError(METHOD_NOT_FOUND) for unknown wc commands', () => {
    const e = captureThrow(() => resolveDispatch('chia_totallyMadeUp'));
    expect(e).toBeInstanceOf(WcError);
    expect((e as WcError).code).toBe(WcErrorCode.METHOD_NOT_FOUND);
    expect((e as WcError).message).toBe('unknown wc command: chia_totallyMadeUp');
  });

  it('throws for handler-routed meta-commands routed through daemon dispatch', () => {
    // Callers must intercept via `entry.handlerKey` before resolveDispatch.
    for (const wc of [
      'chia_requestPermissions',
      'chia_showNotification',
      'chia_addCATToken',
      'chia_transferDID',
      'chia_createNewDIDWallet',
    ]) {
      const e = captureThrow(() => resolveDispatch(wc));
      expect(e).toBeInstanceOf(WcError);
      expect((e as WcError).code).toBe(WcErrorCode.METHOD_NOT_FOUND);
      expect((e as WcError).message).toBe(`wc command not dispatchable: ${wc}`);
    }
  });

  it('routes the legacy `chia_getCurrentAddress` alias to `get_next_address`', () => {
    // No daemon `get_current_address` RPC — alias lands on `get_next_address`.
    expect(resolveDispatch('chia_getCurrentAddress')).toEqual({
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
    expect(result?.schema.dapp?.wcCommand).toBe('chia_sendTransaction');
  });

  it('returns ns + schema for a handler-routed meta-command', () => {
    const result = getCommandByWc('chia_requestPermissions');
    expect(result?.nsCommand).toBe('chia_app.request_permissions');
    expect(result?.handlerKey).toBe('requestPermissions');
  });

  it('returns ns + schema + handlerKey for handler-routed wallet flows', () => {
    const addCat = getCommandByWc('chia_addCATToken');
    expect(addCat?.nsCommand).toBe('chia_app.add_cat_token');
    expect(addCat?.handlerKey).toBe('addCATToken');

    const transferDid = getCommandByWc('chia_transferDID');
    expect(transferDid?.nsCommand).toBe('chia_app.transfer_did');
    expect(transferDid?.handlerKey).toBe('transferDID');

    const createDid = getCommandByWc('chia_createNewDIDWallet');
    expect(createDid?.nsCommand).toBe('chia_app.create_new_did_wallet');
    expect(createDid?.handlerKey).toBe('createNewDIDWallet');
  });

  it('returns the parent ns + schema for an alias wcCommand', () => {
    // Alias dispatch must land on the real `get_next_address` RPC; without
    // this the daemon would reject with "unknown_command get_current_address".
    const result = getCommandByWc('chia_getCurrentAddress');
    expect(result?.nsCommand).toBe('chia_wallet.get_next_address');
    expect(result?.defaults).toEqual({ wallet_id: 1, new_address: false });
  });

  it('daemon-routed commands carry no handlerKey', () => {
    const result = getCommandByWc('chia_sendTransaction');
    expect(result?.handlerKey).toBeUndefined();
  });

  it('returns undefined for unknown commands', () => {
    expect(getCommandByWc('chia_definitelyNotReal')).toBeUndefined();
  });
});

describe('validateDappParams', () => {
  function expectThrow(fn: () => unknown, code: number, message: string) {
    const e = captureThrow(fn);
    expect(e).toBeInstanceOf(WcError);
    expect((e as WcError).code).toBe(code);
    expect((e as WcError).message).toBe(message);
  }

  it('returns silently for a payload whose every key is declared with dappAllowed:true', () => {
    expect(() =>
      validateDappParams('chia_sendTransaction', { amount: '5', fee: '0', address: 'txch1abc' }),
    ).not.toThrow();
  });

  it('returns silently for an empty payload', () => {
    expect(() => validateDappParams('chia_sendTransaction', {})).not.toThrow();
  });

  it('throws WcError(INVALID_PARAMS) for a key not declared in the schema', () => {
    expectThrow(
      () => validateDappParams('chia_sendTransaction', { amount: '5', evil_extra: true }),
      WcErrorCode.INVALID_PARAMS,
      'param not allowed for dapp: evil_extra',
    );
  });

  it('throws WcError(METHOD_NOT_FOUND) for an unknown wc command', () => {
    expectThrow(
      () => validateDappParams('chia_totallyMadeUp', { x: 1 }),
      WcErrorCode.METHOD_NOT_FOUND,
      'unknown wc command: chia_totallyMadeUp',
    );
  });

  it('throws when the schema has no params and the dapp sends one', () => {
    expectThrow(
      () => validateDappParams('chia_getOffersCount', { sneaky: 1 }),
      WcErrorCode.INVALID_PARAMS,
      'param not allowed for dapp: sneaky',
    );
  });

  it('runs against snake-cased keys (caller is responsible for canonicalisation)', () => {
    expectThrow(
      () => validateDappParams('chia_sendTransaction', { walletId: 1 }),
      WcErrorCode.INVALID_PARAMS,
      'param not allowed for dapp: walletId',
    );
    expect(() => validateDappParams('chia_sendTransaction', { wallet_id: 1 })).not.toThrow();
  });

  it('handler-routed commands enforce the same allowlist', () => {
    expect(() => validateDappParams('chia_addCATToken', { asset_id: 'abc', name: 'My CAT' })).not.toThrow();
    expectThrow(
      () => validateDappParams('chia_addCATToken', { asset_id: 'abc', stowaway: true }),
      WcErrorCode.INVALID_PARAMS,
      'param not allowed for dapp: stowaway',
    );
  });

  it('aliases inherit the base schema params (chia_getCurrentAddress)', () => {
    expect(() => validateDappParams('chia_getCurrentAddress', { wallet_id: 1, new_address: false })).not.toThrow();
    expectThrow(
      () => validateDappParams('chia_getCurrentAddress', { surprise: true }),
      WcErrorCode.INVALID_PARAMS,
      'param not allowed for dapp: surprise',
    );
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
    const result = filterRequestedCommands(['sendTransaction']);
    expect(result.allowed).toEqual([]);
    expect(result.rejected).toEqual(['sendTransaction']);
  });

  it('drops methods outside the chia_ namespace into rejected (still string match)', () => {
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
    const result = filterRequestedCommands(['chia_sendTransaction', null, 42] as unknown);
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

  it('keeps handler-routed meta-commands so the WC SDK accepts them at session approval', () => {
    const result = filterRequestedCommands(['chia_requestPermissions', 'chia_showNotification']);
    expect(result.allowed.sort()).toEqual(['chia_requestPermissions', 'chia_showNotification']);
    expect(result.rejected).toEqual([]);
  });

  it('keeps handler-routed wallet-flow commands (createNewDIDWallet, transferDID, addCATToken)', () => {
    const result = filterRequestedCommands(['chia_createNewDIDWallet', 'chia_transferDID', 'chia_addCATToken']);
    expect(result.allowed.sort()).toEqual(['chia_addCATToken', 'chia_createNewDIDWallet', 'chia_transferDID']);
    expect(result.rejected).toEqual([]);
  });
});

describe('commandsMetadata', () => {
  // Renderer's `useCommandMetadata` depends on this shape; Settings UI
  // would otherwise show bare wcCommand strings.
  const snapshot = commandsMetadata();
  const byWc = new Map(snapshot.map((m) => [m.wcCommand, m]));

  it('returns an entry for every schema dapp.wcCommand and every alias (no orphans)', () => {
    let expected = 0;
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (schema.dapp) {
        expected += 1;
        expected += schema.dapp.aliases?.length ?? 0;
      }
    }
    expect(snapshot.length).toBe(expected);
  });

  it('includes the handler-routed meta-commands so the Settings UI can label them', () => {
    expect(byWc.get('chia_requestPermissions')?.label).toBe('Request Permissions');
    expect(byWc.get('chia_showNotification')?.label).toBeDefined();
  });

  it('includes the handler-routed wallet flows', () => {
    expect(byWc.get('chia_addCATToken')?.label).toBe('Add CAT Token');
    expect(byWc.get('chia_transferDID')?.label).toBe('Transfer DID');
    expect(byWc.get('chia_createNewDIDWallet')?.label).toBe('Create new DID Wallet');
  });

  it('includes alias wcCommands (chia_getCurrentAddress) so Settings can render them', () => {
    const entry = byWc.get('chia_getCurrentAddress');
    expect(entry).toBeDefined();
    expect(entry?.requiresSync).toBe(false);
  });

  it('resolves label and description strings (i18n call happened at fetch time)', () => {
    const sendTx = byWc.get('chia_sendTransaction');
    expect(sendTx?.label).toBe('Send Transaction');
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

  it('exposes a label for chia_getFullNodePeerCount with requiresSync false', () => {
    expect(byWc.get('chia_getFullNodePeerCount')?.label).toBe('Get Full Node Peer Count');
    expect(byWc.get('chia_getFullNodePeerCount')?.requiresSync).toBe(false);
  });
});

describe('applyDefaults', () => {
  // The wire envelope must carry `wallet_id: 1` etc. that dapps conventionally
  // omit; without these, daemon RPCs silently fail.

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
    const out = applyDefaults('chia_getNextAddress', { new_address: false });
    expect(out.new_address).toBe(false);
  });

  it('alias pins its own default (chia_getCurrentAddress → new_address: false)', () => {
    // Without per-alias defaults the base would flip `new_address: true`
    // and the dapp would silently get a fresh address on every call.
    const out = applyDefaults('chia_getCurrentAddress', {});
    expect(out.wallet_id).toBe(1);
    expect(out.new_address).toBe(false);
  });

  it('alias still lets the dapp opt out of the alias default', () => {
    const out = applyDefaults('chia_getCurrentAddress', { new_address: true });
    expect(out.new_address).toBe(true);
  });
});

describe('dapp.transformResponse', () => {
  // Pins the legacy api-react response shapes for dapps written against the
  // old endpoints. If you change the function's behaviour you'll likely
  // break a real dapp — bump the test deliberately.

  function tx(wcCommand: string, input: unknown) {
    const fn = getCommandByWc(wcCommand)?.schema.dapp?.transformResponse;
    if (!fn) throw new Error(`no transformResponse on ${wcCommand}`);
    return fn(input as Record<string, unknown>);
  }

  it('chia_getWallets unwraps to the wallets array', () => {
    expect(tx('chia_getWallets', { wallets: [{ id: 1 }], success: true })).toEqual([{ id: 1 }]);
    expect(tx('chia_getWallets', { wallets: undefined, success: true })).toEqual([]);
  });

  it('chia_getTransaction unwraps to the transaction', () => {
    expect(tx('chia_getTransaction', { transaction: { name: '0xabc' } })).toEqual({ name: '0xabc' });
  });

  it('chia_getWalletBalance unwraps to walletBalance (raw — no BigNumber math here)', () => {
    expect(tx('chia_getWalletBalance', { walletBalance: { confirmed: '5', unconfirmed: '3' } })).toEqual({
      confirmed: '5',
      unconfirmed: '3',
    });
  });

  it('chia_getWalletBalances unwraps to walletBalances dict', () => {
    expect(tx('chia_getWalletBalances', { walletBalances: { '1': { confirmed: '0' } } })).toEqual({
      '1': { confirmed: '0' },
    });
  });

  it('chia_getNextAddress unwraps to address', () => {
    expect(tx('chia_getNextAddress', { address: 'xch1abc' })).toBe('xch1abc');
  });

  it('chia_getCurrentAddress (alias of get_next_address) inherits the same transform', () => {
    expect(tx('chia_getCurrentAddress', { address: 'xch1abc' })).toBe('xch1abc');
  });

  it('chia_getHeightInfo surfaces height fields and null-fills the optional ones', () => {
    expect(tx('chia_getHeightInfo', { height: 100, latestTimestamp: 200 })).toEqual({
      height: 100,
      latestTimestamp: 200,
      isTransactionBlock: null,
      prevTransactionBlockHeight: null,
    });
    expect(
      tx('chia_getHeightInfo', {
        height: 100,
        latestTimestamp: 200,
        isTransactionBlock: true,
        prevTransactionBlockHeight: 99,
      }),
    ).toEqual({ height: 100, latestTimestamp: 200, isTransactionBlock: true, prevTransactionBlockHeight: 99 });
  });

  it('chia_getAllOffers returns tradeRecords as-is when offers is absent, zips _offerData when present', () => {
    expect(tx('chia_getAllOffers', { tradeRecords: [{ tradeId: 'a' }, { tradeId: 'b' }] })).toEqual([
      { tradeId: 'a' },
      { tradeId: 'b' },
    ]);
    expect(
      tx('chia_getAllOffers', {
        tradeRecords: [{ tradeId: 'a' }, { tradeId: 'b' }],
        offers: ['offerA', 'offerB'],
      }),
    ).toEqual([
      { tradeId: 'a', _offerData: 'offerA' },
      { tradeId: 'b', _offerData: 'offerB' },
    ]);
  });

  it('chia_getCATAssetId unwraps to assetId', () => {
    expect(tx('chia_getCATAssetId', { assetId: '0xdeadbeef' })).toBe('0xdeadbeef');
  });

  it('chia_getFullNodePeerCount unwraps to peerCount', () => {
    expect(tx('chia_getFullNodePeerCount', { peerCount: 8, success: true })).toBe(8);
  });

  it('chia_getNFTWalletsWithDIDs unwraps to nftWallets', () => {
    expect(tx('chia_getNFTWalletsWithDIDs', { nftWallets: [{ walletId: 5 }] })).toEqual([{ walletId: 5 }]);
  });

  it('chia_getVC unwraps to vcRecord', () => {
    expect(tx('chia_getVC', { vcRecord: { vcId: '0xabc' } })).toEqual({ vcId: '0xabc' });
  });

  it('chia_getWalletAddresses unwraps to walletAddresses', () => {
    expect(tx('chia_getWalletAddresses', { walletAddresses: { '0x1': [{ address: 'xch1abc' }] } })).toEqual({
      '0x1': [{ address: 'xch1abc' }],
    });
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
