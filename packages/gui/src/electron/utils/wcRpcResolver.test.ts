/**
 * `wcRpcResolver.ts` is the single place in main that maps WalletConnect
 * camelCase command names to daemon snake_case RPC names. The renderer's
 * `WalletConnectCommands.tsx` carries no such metadata; main owns it.
 *
 * The tests assert two things:
 *  - the override map's values are valid snake_case names (no leftover
 *    underscore-separated single letters from a regex that mishandled
 *    acronyms);
 *  - every WC command name from the source list with adjacent caps
 *    (acronyms — CAT/NFT/DID/VC/IDs) has an explicit override, since the
 *    naive camelCase→snake_case fallback would produce the wrong RPC name
 *    for those.
 *
 * The WalletConnectCommands.tsx module pulls in JSX and CSS that jest's
 * transformer can't handle, so we read the source as text and pull each
 * entry's `command:` field via regex.
 */
import fs from 'node:fs';
import path from 'node:path';

import { resolveDaemonRpc, WC_RPC_OVERRIDE_KEYS } from './wcRpcResolver';

const VALID_SNAKE_RE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const ACRONYM_RE = /[A-Z]{2,}/;

function readWcCommandNames(): { command: string; service?: string }[] {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../constants/WalletConnectCommands.tsx'),
    'utf8',
  );
  const result: { command: string; service?: string }[] = [];
  const startRe = /\n {2}\{\n/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = startRe.exec(source))) starts.push(m.index + 1);

  for (const start of starts) {
    const closeRe = /\n {2}\},/g;
    closeRe.lastIndex = start;
    const close = closeRe.exec(source);
    if (!close) continue;
    const block = source.slice(start, close.index + close[0].length);
    const command = /command: '([^']+)'/.exec(block)?.[1];
    if (!command) continue;
    const service = /service: ServiceName\.([A-Z_]+)|service: '([A-Z]+)'/.exec(block);
    result.push({ command, service: service ? service[1] || service[2] : undefined });
  }
  return result;
}

const ALL_WC = readWcCommandNames();
const dispatchable = ALL_WC.filter((e) => e.service !== 'EXECUTE' && e.service !== 'NOTIFICATION');

// Commands whose RTK Query endpoint composes multiple daemon RPCs (e.g.
// `transferDID`, `createNewDIDWallet`); they can't be dispatched as a single
// `dispatchAsPair` call regardless of which RPC name we'd map them to. The
// allowlist documents the gap.
const KNOWN_ORCHESTRATION_ONLY = new Set(['createNewDIDWallet', 'transferDID']);

describe('wcRpcResolver', () => {
  it('every override value is a valid snake_case daemon RPC name', () => {
    const failures: string[] = [];
    for (const wc of WC_RPC_OVERRIDE_KEYS) {
      const rpc = resolveDaemonRpc(wc);
      if (!VALID_SNAKE_RE.test(rpc)) {
        failures.push(`${wc} → ${rpc}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('every WC command with adjacent caps has an explicit override', () => {
    const overrides = new Set(WC_RPC_OVERRIDE_KEYS);
    const missing = dispatchable
      .filter((e) => ACRONYM_RE.test(e.command) && !overrides.has(e.command) && !KNOWN_ORCHESTRATION_ONLY.has(e.command))
      .map((e) => e.command);
    expect(missing).toEqual([]);
  });

  it('camelToSnake fallback resolves trivial cases', () => {
    expect(resolveDaemonRpc('sendTransaction')).toBe('send_transaction');
    expect(resolveDaemonRpc('takeOffer')).toBe('take_offer');
    expect(resolveDaemonRpc('cancelOffer')).toBe('cancel_offer');
    expect(resolveDaemonRpc('createOfferForIds')).toBe('create_offer_for_ids');
    expect(resolveDaemonRpc('logIn')).toBe('log_in');
    expect(resolveDaemonRpc('signMessageByAddress')).toBe('sign_message_by_address');
    expect(resolveDaemonRpc('signMessageById')).toBe('sign_message_by_id');
  });

  it.each([
    ['spendCAT', 'cat_spend'],
    ['mintNFT', 'nft_mint_nft'],
    ['mintBulk', 'nft_mint_bulk'],
    ['transferNFT', 'nft_transfer_nft'],
    ['setNFTDID', 'nft_set_nft_did'],
    ['findLostDID', 'did_find_lost'],
    ['updateDIDMetadata', 'did_update_metadata'],
    ['updateDIDRecoveryIds', 'did_update_recovery_ids'],
    ['setDIDName', 'did_set_wallet_name'],
    ['spendVC', 'vc_spend'],
    ['addVCProofs', 'vc_add_proofs'],
    ['revokeVC', 'vc_revoke'],
    ['getCATWalletInfo', 'cat_asset_id_to_name'],
    ['getCATAssetId', 'cat_get_asset_id'],
    ['getNFTInfo', 'nft_get_info'],
    ['getNFTs', 'nft_get_nfts'],
    ['getNFTsCount', 'nft_count_nfts'],
    ['getDIDInfo', 'did_get_info'],
    ['getProofsForRoot', 'vc_get_proofs_for_root'],
  ])('resolves %s → %s', (wc, expected) => {
    expect(resolveDaemonRpc(wc)).toBe(expected);
  });

  it('unknown command falls back to camelToSnake', () => {
    expect(resolveDaemonRpc('totallyUnknownThing')).toBe('totally_unknown_thing');
  });
});
