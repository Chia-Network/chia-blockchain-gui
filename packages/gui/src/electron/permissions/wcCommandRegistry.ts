/**
 * Single, main-side registry of every WalletConnect command this wallet
 * recognizes. It is the only authoritative answer to two questions:
 *   1. Does a given WC command name (e.g. `sendTransaction`) map to a daemon
 *      RPC, and which destination service does it live on?
 *   2. Is that command allowed to be invoked by a paired dapp at all?
 *
 * Question (1) is shape; question (2) is policy. Shape lives here. Policy
 * lives on `confirmSchemas`'s `dappAllowed` flag — this file looks it up.
 *
 * The renderer-side `walletConnectCommands.tsx` carries display metadata
 * (labels, param JSX, hide flags). It is NOT trusted for security: a
 * compromised renderer could send any (`destination`, `wcCommand`) pair to
 * `dispatchAsPair`. Main resolves both against this registry, so anything
 * the renderer claims is independently verified.
 *
 * Two special entries (`requestPermissions`, `showNotification`) are
 * renderer-handled meta-commands. They never reach `dispatchAsPair` — their
 * presence here is so the WC session-approval namespaces can list them as
 * supported methods (the WC SDK enforces method scope at session level).
 */
import { getConfirmSchema } from '../dialogs/Confirm/confirmSchemas';

import { resolveDaemonRpc } from '../utils/wcRpcResolver';

export type WcCommandEntry =
  | {
      kind: 'rpc';
      wcCommand: string;
      /** Daemon destination service (e.g. `chia_wallet`). */
      service: string;
      /** Pre-computed `${service}.${resolveDaemonRpc(wcCommand)}`. */
      nsCommand: string;
    }
  | {
      kind: 'renderer';
      wcCommand: string;
    };

const WALLET = 'chia_wallet';
const FULL_NODE = 'chia_full_node';
const DATALAYER = 'chia_data_layer';
const DAEMON = 'daemon';

function rpc(wcCommand: string, service: string): WcCommandEntry {
  return { kind: 'rpc', wcCommand, service, nsCommand: `${service}.${resolveDaemonRpc(wcCommand)}` };
}

function renderer(wcCommand: string): WcCommandEntry {
  return { kind: 'renderer', wcCommand };
}

/**
 * Mirrors every dispatchable entry in `constants/WalletConnectCommands.tsx`.
 * Adding a new WC command on the renderer side without an entry here means:
 *   - the WC SDK will accept the dapp's request (renderer routes it),
 *   - but `permissions:dispatchAsPair` will reject before reaching the
 *     daemon, because the registry lookup fails.
 * This is the intended fail-closed behavior — main never extends trust based
 * on what the renderer says.
 *
 * Renderer-side orchestration commands (`addCATToken`, `createNewDIDWallet`,
 * `transferDID`) are intentionally omitted: they compose multiple daemon
 * RPCs from the renderer and do not map cleanly to a single dispatchable
 * call. Filter them out at pairing rather than route to the wrong RPC.
 */
const REGISTRY: WcCommandEntry[] = [
  // ─ Renderer-handled meta-commands ──────────────────────────────────────────
  renderer('requestPermissions'),
  renderer('showNotification'),

  // ─ chia_wallet ─────────────────────────────────────────────────────────────
  rpc('logIn', WALLET),
  rpc('getWallets', WALLET),
  rpc('getTransaction', WALLET),
  rpc('getWalletBalance', WALLET),
  rpc('getWalletBalances', WALLET),
  rpc('getCurrentAddress', WALLET),
  rpc('getCoinRecordsByNames', WALLET),
  rpc('selectCoins', WALLET),
  rpc('getSpendableCoins', WALLET),
  rpc('sendTransaction', WALLET),
  rpc('spendClawbackCoins', WALLET),
  rpc('signMessageById', WALLET),
  rpc('signMessageByAddress', WALLET),
  rpc('verifySignature', WALLET),
  rpc('getNextAddress', WALLET),
  rpc('getSyncStatus', WALLET),
  rpc('getHeightInfo', WALLET),
  rpc('getPuzzleAndSolution', WALLET),
  rpc('pushTransactions', WALLET),
  rpc('getAllOffers', WALLET),
  rpc('getOffersCount', WALLET),
  rpc('createOfferForIds', WALLET),
  rpc('cancelOffer', WALLET),
  rpc('checkOfferValidity', WALLET),
  rpc('takeOffer', WALLET),
  rpc('getOfferSummary', WALLET),
  rpc('getOfferData', WALLET),
  rpc('getOfferRecord', WALLET),
  rpc('getCATWalletInfo', WALLET),
  rpc('getCATAssetId', WALLET),
  rpc('spendCAT', WALLET),
  rpc('getNFTs', WALLET),
  rpc('getNFTInfo', WALLET),
  rpc('mintBulk', WALLET),
  rpc('mintNFT', WALLET),
  rpc('transferNFT', WALLET),
  rpc('getNFTsCount', WALLET),
  rpc('createNewRemoteWallet', WALLET),
  rpc('registerRemoteCoins', WALLET),
  rpc('findLostDID', WALLET),
  rpc('getDIDCurrentCoinInfo', WALLET),
  rpc('getDID', WALLET),
  rpc('getDIDInfo', WALLET),
  rpc('getDIDInformationNeededForRecovery', WALLET),
  rpc('getDIDMetadata', WALLET),
  rpc('getDIDPubkey', WALLET),
  rpc('getDIDRecoveryList', WALLET),
  rpc('updateDIDMetadata', WALLET),
  rpc('updateDIDRecoveryIds', WALLET),
  rpc('getDIDName', WALLET),
  rpc('setDIDName', WALLET),
  rpc('setNFTDID', WALLET),
  rpc('getNFTWalletsWithDIDs', WALLET),
  rpc('getVCList', WALLET),
  rpc('getVC', WALLET),
  rpc('spendVC', WALLET),
  rpc('addVCProofs', WALLET),
  rpc('getProofsForRoot', WALLET),
  rpc('revokeVC', WALLET),

  // ─ chia_full_node ──────────────────────────────────────────────────────────
  rpc('pushTx', FULL_NODE),

  // ─ chia_data_layer ─────────────────────────────────────────────────────────
  rpc('addMirror', DATALAYER),
  rpc('addMissingFiles', DATALAYER),
  rpc('batchUpdate', DATALAYER),
  rpc('cancelDataLayerOffer', DATALAYER),
  rpc('checkPlugins', DATALAYER),
  rpc('clearPendingRoots', DATALAYER),
  rpc('createDataStore', DATALAYER),
  rpc('deleteKey', DATALAYER),
  rpc('deleteMirror', DATALAYER),
  rpc('getAncestors', DATALAYER),
  rpc('getKeys', DATALAYER),
  rpc('getKeysValues', DATALAYER),
  rpc('getKvDiff', DATALAYER),
  rpc('getLocalRoot', DATALAYER),
  rpc('getMirrors', DATALAYER),
  rpc('getOwnedStores', DATALAYER),
  rpc('getRoot', DATALAYER),
  rpc('getRoots', DATALAYER),
  rpc('getRootHistory', DATALAYER),
  rpc('getDataLayerSyncStatus', DATALAYER),
  rpc('getValue', DATALAYER),
  rpc('insert', DATALAYER),
  rpc('makeDataLayerOffer', DATALAYER),
  rpc('removeSubscriptions', DATALAYER),
  rpc('subscribe', DATALAYER),
  rpc('subscriptions', DATALAYER),
  rpc('takeDataLayerOffer', DATALAYER),
  rpc('unsubscribe', DATALAYER),
  rpc('verifyOffer', DATALAYER),

  // ─ daemon ──────────────────────────────────────────────────────────────────
  rpc('getWalletAddresses', DAEMON),
  rpc('getPublicKey', DAEMON),
];

const BY_WC_COMMAND = new Map<string, WcCommandEntry>(REGISTRY.map((e) => [e.wcCommand, e]));

/** Look up a registry entry by WC command name (camelCase, no `chia_` prefix). */
export function getWcCommandEntry(wcCommand: string): WcCommandEntry | undefined {
  return BY_WC_COMMAND.get(wcCommand);
}

/**
 * True iff a paired dapp is allowed to invoke this WC command. Two layers:
 *   - the command must exist in the registry (shape),
 *   - either it is renderer-handled (always allowed at session level) or its
 *     resolved schema declares `dappAllowed: true` (policy).
 */
export function isDappAllowedWcCommand(wcCommand: string): boolean {
  const entry = BY_WC_COMMAND.get(wcCommand);
  if (!entry) return false;
  if (entry.kind === 'renderer') return true;
  return getConfirmSchema(entry.nsCommand).dappAllowed === true;
}

/**
 * Filter a list of WC method names (the `chia_<wcCommand>` form sent in the
 * session proposal's `namespaces.chia.methods`) into the subset this wallet
 * lets dapps invoke. Returns both the kept and the rejected sets so callers
 * can show the user what was excluded.
 *
 * Defensive against non-array input: `for...of` would throw on objects, and
 * this is reached at an IPC boundary where TypeScript's `string[]` is just a
 * suggestion. A compromised renderer sending `requestedMethods: {0: 'x'}`
 * would otherwise crash the PAIR_REGISTER handler before the dialog opens.
 */
export function filterRequestedMethods(requestedMethods: unknown): {
  allowedWcCommands: string[];
  rejectedWcCommands: string[];
} {
  const allowed: string[] = [];
  const rejected: string[] = [];
  if (!Array.isArray(requestedMethods)) {
    return { allowedWcCommands: allowed, rejectedWcCommands: rejected };
  }
  const seen = new Set<string>();
  for (const method of requestedMethods) {
    if (typeof method !== 'string') continue;
    // WC namespace methods are always `chia_<wcCommand>`; anything else is
    // outside the chia namespace and we do not handle it.
    if (!method.startsWith('chia_')) continue;
    const wcCommand = method.slice('chia_'.length);
    if (!wcCommand || seen.has(wcCommand)) continue;
    seen.add(wcCommand);
    if (isDappAllowedWcCommand(wcCommand)) {
      allowed.push(wcCommand);
    } else {
      rejected.push(wcCommand);
    }
  }
  return { allowedWcCommands: allowed, rejectedWcCommands: rejected };
}

/**
 * Resolve a (`destination`, `wcCommand`) tuple supplied by the renderer at
 * dispatch time against the registry. Rejects if the command is unknown, if
 * it is renderer-handled (those never dispatch), or if the destination does
 * not match the registry's recorded service. Returns both the canonical
 * `nsCommand` (for permission resolution) and the bare `command` (for the
 * wire envelope).
 */
export function resolveDispatchTarget(
  destination: string,
  wcCommand: string,
): { ok: true; nsCommand: string; command: string } | { ok: false; reason: string } {
  const entry = BY_WC_COMMAND.get(wcCommand);
  if (!entry) {
    return { ok: false, reason: `unknown wc command: ${wcCommand}` };
  }
  if (entry.kind === 'renderer') {
    return { ok: false, reason: `wc command not dispatchable: ${wcCommand}` };
  }
  if (entry.service !== destination) {
    return { ok: false, reason: `destination mismatch for ${wcCommand}: expected ${entry.service}, got ${destination}` };
  }
  // The bare daemon RPC name = nsCommand minus the `${service}.` prefix.
  // Pre-computed at registry-build time so we never recompute here.
  return { ok: true, nsCommand: entry.nsCommand, command: entry.nsCommand.slice(entry.service.length + 1) };
}

/** Exposed for tests so they can iterate the table without importing internals. */
export const REGISTRY_ENTRIES: readonly WcCommandEntry[] = REGISTRY;
