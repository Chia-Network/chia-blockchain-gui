/**
 * The registry is the only place main resolves a WC command to a daemon
 * destination, and the only place it answers "may a paired dapp invoke
 * this." A regression here means a compromised renderer can either bypass
 * the dispatch gate or talk to a service it was never granted access to.
 *
 * The schema (confirmSchemas.ts) is the security policy; the registry is
 * the shape mapping. Both must agree, and these tests pin the agreement.
 */
import fs from 'node:fs';
import path from 'node:path';

import { getConfirmSchema, SCHEMA_COMMANDS } from '../dialogs/Confirm/confirmSchemas';
import { resolveDaemonRpc } from '../utils/wcRpcResolver';

import {
  filterRequestedMethods,
  getWcCommandEntry,
  isDappAllowedWcCommand,
  REGISTRY_ENTRIES,
  resolveDispatchTarget,
} from './wcCommandRegistry';

describe('wcCommandRegistry shape', () => {
  it('has unique wcCommand names', () => {
    const seen = new Map<string, number>();
    for (const entry of REGISTRY_ENTRIES) {
      seen.set(entry.wcCommand, (seen.get(entry.wcCommand) ?? 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dupes).toEqual([]);
  });

  it('rpc entries have nsCommand = `${service}.${resolveDaemonRpc(wcCommand)}`', () => {
    for (const entry of REGISTRY_ENTRIES) {
      if (entry.kind !== 'rpc') continue;
      expect(entry.nsCommand).toBe(`${entry.service}.${resolveDaemonRpc(entry.wcCommand)}`);
    }
  });

  it('renderer entries are listed only for known meta-commands', () => {
    const rendererNames = REGISTRY_ENTRIES.filter((e) => e.kind === 'renderer').map((e) => e.wcCommand);
    expect(rendererNames.sort()).toEqual(['requestPermissions', 'showNotification']);
  });

  it('rpc entries route only to known daemon services', () => {
    const known = new Set(['chia_wallet', 'chia_full_node', 'chia_data_layer', 'daemon']);
    for (const entry of REGISTRY_ENTRIES) {
      if (entry.kind !== 'rpc') continue;
      expect(known.has(entry.service)).toBe(true);
    }
  });
});

describe('wcCommandRegistry coverage vs WalletConnectCommands.tsx', () => {
  // The renderer's WC command list and main's registry must list the same
  // command names. Otherwise either:
  //   - renderer dispatches a command main has never heard of (deny at
  //     gate, ugly user experience), or
  //   - main treats a stale renderer command as live and accepts dispatch
  //     for something the dapp surface no longer claims to support.
  const wcSource = fs.readFileSync(
    path.resolve(__dirname, '../../constants/WalletConnectCommands.tsx'),
    'utf8',
  );

  function parseWcCommandNames(): string[] {
    const out: string[] = [];
    const startRe = /\n {2}\{\n/g;
    let m: RegExpExecArray | null;
    const starts: number[] = [];
    // eslint-disable-next-line no-cond-assign
    while ((m = startRe.exec(wcSource))) starts.push(m.index + 1);
    for (const start of starts) {
      const closeRe = /\n {2}\},/g;
      closeRe.lastIndex = start;
      const close = closeRe.exec(wcSource);
      if (!close) continue;
      const block = wcSource.slice(start, close.index + close[0].length);
      const name = /command: '([^']+)'/.exec(block)?.[1];
      if (name) out.push(name);
    }
    return out;
  }

  const wcCommandNames = parseWcCommandNames();
  const registryNames = new Set(REGISTRY_ENTRIES.map((e) => e.wcCommand));

  // Intentionally omitted from the registry: renderer-side orchestration
  // commands that don't dispatch to a single daemon RPC. Filter them out
  // at pairing rather than wire them to the wrong endpoint. Keep this
  // list aligned with the `ORCHESTRATION_ONLY` set in the registry source.
  const ORCHESTRATION_ONLY_TEST = new Set(['addCATToken', 'createNewDIDWallet', 'transferDID']);

  it('every WC command in the renderer source has a registry entry (or is documented orchestration-only)', () => {
    const missing = wcCommandNames.filter(
      (name) => !registryNames.has(name) && !ORCHESTRATION_ONLY_TEST.has(name),
    );
    expect(missing).toEqual([]);
  });

  it('every registry entry corresponds to a WC command in the renderer source', () => {
    const wcSet = new Set(wcCommandNames);
    const orphans = [...registryNames].filter((name) => !wcSet.has(name));
    expect(orphans).toEqual([]);
  });

  it('orchestration-only commands are filtered out at pairing (rejected, not allowed)', () => {
    const result = filterRequestedMethods(['chia_addCATToken', 'chia_createNewDIDWallet', 'chia_transferDID']);
    expect(result.allowedWcCommands).toEqual([]);
    expect(result.rejectedWcCommands.sort()).toEqual(['addCATToken', 'createNewDIDWallet', 'transferDID']);
  });
});

describe('isDappAllowedWcCommand', () => {
  it('returns true for renderer-handled meta-commands', () => {
    expect(isDappAllowedWcCommand('requestPermissions')).toBe(true);
    expect(isDappAllowedWcCommand('showNotification')).toBe(true);
  });

  it('returns true for rpc commands whose schema declares dappAllowed: true', () => {
    expect(isDappAllowedWcCommand('sendTransaction')).toBe(true);
    expect(isDappAllowedWcCommand('spendCAT')).toBe(true);
    expect(isDappAllowedWcCommand('createOfferForIds')).toBe(true);
    expect(isDappAllowedWcCommand('takeOffer')).toBe(true);
    expect(isDappAllowedWcCommand('signMessageByAddress')).toBe(true);
  });

  it('returns true for read-only stubs', () => {
    expect(isDappAllowedWcCommand('getWallets')).toBe(true);
    expect(isDappAllowedWcCommand('getWalletBalance')).toBe(true);
    expect(isDappAllowedWcCommand('getNFTInfo')).toBe(true);
  });

  it('returns false for commands that are NOT in the registry', () => {
    expect(isDappAllowedWcCommand('totallyMadeUp')).toBe(false);
    expect(isDappAllowedWcCommand('')).toBe(false);
    // Schema-keyed but not exposed via WC at all.
    expect(isDappAllowedWcCommand('deleteKeyButFromUI')).toBe(false);
  });

  it('every dapp-callable WC command resolves to a schema with dappAllowed: true', () => {
    for (const entry of REGISTRY_ENTRIES) {
      if (entry.kind !== 'rpc') continue;
      const schema = getConfirmSchema(entry.nsCommand);
      // We require a schema entry for every dispatchable RPC, even if it's
      // a read with no dialog UI. The flag is the source of truth.
      expect(SCHEMA_COMMANDS).toContain(entry.nsCommand);
      expect(schema.dappAllowed).toBe(true);
    }
  });
});

describe('filterRequestedMethods', () => {
  it('returns empty lists for an empty input', () => {
    expect(filterRequestedMethods([])).toEqual({ allowedWcCommands: [], rejectedWcCommands: [] });
  });

  it('strips the chia_ prefix and partitions by registry membership', () => {
    const result = filterRequestedMethods([
      'chia_sendTransaction',
      'chia_getWallets',
      'chia_totallyMadeUp',
    ]);
    expect(result.allowedWcCommands.sort()).toEqual(['getWallets', 'sendTransaction']);
    expect(result.rejectedWcCommands).toEqual(['totallyMadeUp']);
  });

  it('drops methods outside the chia_ namespace silently', () => {
    const result = filterRequestedMethods([
      'eip155_personal_sign',
      'cosmos_signDirect',
      'chia_sendTransaction',
    ]);
    expect(result.allowedWcCommands).toEqual(['sendTransaction']);
    expect(result.rejectedWcCommands).toEqual([]);
  });

  it('deduplicates repeated method names', () => {
    const result = filterRequestedMethods([
      'chia_sendTransaction',
      'chia_sendTransaction',
      'chia_madeUp',
      'chia_madeUp',
    ]);
    expect(result.allowedWcCommands).toEqual(['sendTransaction']);
    expect(result.rejectedWcCommands).toEqual(['madeUp']);
  });

  it('ignores non-string entries', () => {
    const result = filterRequestedMethods([
      'chia_sendTransaction',
      // @ts-expect-error - exercising defensive runtime check
      null,
      // @ts-expect-error
      42,
    ]);
    expect(result.allowedWcCommands).toEqual(['sendTransaction']);
    expect(result.rejectedWcCommands).toEqual([]);
  });

  it('drops empty wcCommand suffix (`chia_` alone)', () => {
    expect(filterRequestedMethods(['chia_'])).toEqual({ allowedWcCommands: [], rejectedWcCommands: [] });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['object literal', { 0: 'chia_sendTransaction' }],
    ['number', 42],
    ['string', 'chia_sendTransaction'],
  ])('returns empty lists when requestedMethods is %s (defensive against IPC-boundary garbage)', (_label, val) => {
    expect(filterRequestedMethods(val as unknown)).toEqual({ allowedWcCommands: [], rejectedWcCommands: [] });
  });

  it('keeps renderer-handled meta-commands (requestPermissions, showNotification)', () => {
    const result = filterRequestedMethods(['chia_requestPermissions', 'chia_showNotification']);
    expect(result.allowedWcCommands.sort()).toEqual(['requestPermissions', 'showNotification']);
    expect(result.rejectedWcCommands).toEqual([]);
  });
});

describe('resolveDispatchTarget', () => {
  it('resolves a known (destination, wcCommand) pair to its nsCommand and bare command', () => {
    expect(resolveDispatchTarget('chia_wallet', 'sendTransaction')).toEqual({
      ok: true,
      nsCommand: 'chia_wallet.send_transaction',
      command: 'send_transaction',
    });
  });

  it('resolves acronym-bearing commands via the wcRpcResolver overrides', () => {
    expect(resolveDispatchTarget('chia_wallet', 'spendCAT')).toEqual({
      ok: true,
      nsCommand: 'chia_wallet.cat_spend',
      command: 'cat_spend',
    });
  });

  it('rejects unknown wc commands', () => {
    expect(resolveDispatchTarget('chia_wallet', 'totallyMadeUp')).toEqual({
      ok: false,
      reason: 'unknown wc command: totallyMadeUp',
    });
  });

  it('rejects renderer-handled commands routed through dispatch', () => {
    // requestPermissions never reaches dispatchAsPair under normal flow;
    // a compromised renderer that tries it gets bounced.
    expect(resolveDispatchTarget('chia_wallet', 'requestPermissions')).toEqual({
      ok: false,
      reason: 'wc command not dispatchable: requestPermissions',
    });
    expect(resolveDispatchTarget('chia_wallet', 'showNotification')).toEqual({
      ok: false,
      reason: 'wc command not dispatchable: showNotification',
    });
  });

  it('rejects when the destination does not match the registry', () => {
    // sendTransaction lives on chia_wallet. A renderer claiming "send it to
    // chia_data_layer" must not be allowed to talk to a service the user
    // didn't grant the dapp access to.
    const result = resolveDispatchTarget('chia_data_layer', 'sendTransaction');
    expect(result).toEqual({
      ok: false,
      reason: 'destination mismatch for sendTransaction: expected chia_wallet, got chia_data_layer',
    });
  });
});

describe('getWcCommandEntry', () => {
  it('returns the entry for a known WC command', () => {
    const entry = getWcCommandEntry('sendTransaction');
    expect(entry).toEqual({
      kind: 'rpc',
      wcCommand: 'sendTransaction',
      service: 'chia_wallet',
      nsCommand: 'chia_wallet.send_transaction',
    });
  });

  it('returns the renderer entry for meta-commands', () => {
    expect(getWcCommandEntry('requestPermissions')).toEqual({
      kind: 'renderer',
      wcCommand: 'requestPermissions',
    });
  });

  it('returns undefined for unknown commands', () => {
    expect(getWcCommandEntry('definitelyNotReal')).toBeUndefined();
  });
});
