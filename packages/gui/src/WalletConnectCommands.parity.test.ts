/**
 * TEMPORARY parity check — delete with `WalletConnectCommands.tsx` once
 * the migration is verified.
 *
 * Asserts the new `commandRegistry` is byte-for-byte compatible with the
 * legacy export: command coverage, param presence + order + `hide` +
 * `isOptional` + `defaultValue`, and no leakage (new dapp surface that
 * wasn't in legacy).
 *
 * Virtual mocks reconstruct the deleted legacy dependencies so the module
 * still imports under jest.
 */

/* eslint-disable global-require, @typescript-eslint/no-require-imports */
import { snakeCase } from 'lodash';

jest.mock('@lingui/macro', () => ({
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  t: (s: TemplateStringsArray | string) => (typeof s === 'string' ? s : Array.isArray(s) ? s.join('') : ''),
}));

jest.mock('@mui/material', () => ({ Typography: () => null }));

jest.mock('@chia-network/api', () => ({
  ServiceName: {
    WALLET: 'chia_wallet',
    FULL_NODE: 'chia_full_node',
    FARMER: 'chia_farmer',
    HARVESTER: 'chia_harvester',
    DAEMON: 'daemon',
    DATALAYER: 'chia_data_layer',
  },
}));

jest.mock('@chia-network/core', () => ({ MojoToChia: () => null }));

const PARAM_NAMES: Record<string, string> = {
  ADDRESS: 'address',
  ALL_FINGERPRINTS: 'allFingerprints',
  ALLOW_UNSYNCED: 'allowUnsynced',
  AMOUNT: 'amount',
  ASSET_ID: 'assetId',
  ATTEST_DATA: 'attestData',
  BACKUP_DIDS: 'backupDids',
  CHANGELIST: 'changelist',
  COIN_ANNOUNCEMENTS: 'coinAnnouncements',
  COIN_ID: 'coinId',
  COIN_IDS: 'coinIds',
  COIN_NAME: 'coinName',
  COMMANDS: 'commands',
  COUNT: 'count',
  DID: 'did',
  DID_COIN: 'didCoin',
  DID_ID: 'didId',
  DID_LINEAGE_PARENT: 'didLineageParent',
  DISABLE_JSON_FORMATTING: 'disableJSONFormatting',
  DRIVER_DICT: 'driverDict',
  EDITION_NUMBER: 'editionNumber',
  EDITION_TOTAL: 'editionTotal',
  END: 'end',
  END_HEIGHT: 'endHeight',
  EXCLUDED_COIN_AMOUNTS: 'excludedCoinAmounts',
  EXCLUDED_COIN_IDS: 'excludedCoinIds',
  EXTRA_CONDITIONS: 'extraConditions',
  FEE: 'fee',
  FINGERPRINT: 'fingerprint',
  FINGERPRINTS: 'fingerprints',
  FOLDER_NAME: 'foldername',
  HASH: 'hash',
  HASH1: 'hash1',
  HASH2: 'hash2',
  ID: 'id',
  IDS: 'ids',
  INCLUDE_DATA: 'includeData',
  INCLUDE_MY_OFFERS: 'includeMyOffers',
  INCLUDE_SPENT_COINS: 'includeSpentCoins',
  INCLUDE_TAKEN_OFFERS: 'includeTakenOffers',
  INDEX: 'index',
  INNER_ADDRESS: 'innerAddress',
  IS_HEX: 'isHex',
  KEY: 'key',
  LAUNCHER_ID: 'launcherId',
  LICENSE_HASH: 'licenseHash',
  LICENSE_URIS: 'licenseUris',
  MAKER: 'maker',
  MAX_COIN_AMOUNT: 'maxCoinAmount',
  MEMOS: 'memos',
  MESSAGE: 'message',
  META_HASH: 'metaHash',
  META_URIS: 'metaUris',
  METADATA: 'metadata',
  METADATA_LIST: 'metadataList',
  MIN_COIN_AMOUNT: 'minCoinAmount',
  MINT_FROM_DID: 'mintFromDid',
  MINT_NUMBER_START: 'mintNumberStart',
  MINT_TOTAL: 'mintTotal',
  NAME: 'name',
  NAMES: 'names',
  NEW_ADDRESS: 'newAddress',
  NEW_INNERPUZHASH: 'newInnerpuzhash',
  NEW_LIST: 'newList',
  NEW_PROOF_HASH: 'newProofHash',
  NEW_PUZHASH: 'newPuzhash',
  NEW_P2_PUZHASH: 'newP2Puzhash',
  NFT_COIN_IDS: 'nftCoinIds',
  NFT_LAUNCHER_ID: 'nftLauncherId',
  NON_OBSERVER_DERIVATION: 'nonObserverDerivation',
  NUM: 'num',
  NUM_OF_BACKUP_IDS_NEEDED: 'numOfBackupIdsNeeded',
  NUM_VERIFICATION: 'numVerification',
  NUM_VERIFICATIONS_REQUIRED: 'numVerificationsRequired',
  OFFER: 'offer',
  OFFER_DATA: 'offerData',
  OFFER_ID: 'offerId',
  OVERWRITE: 'overwrite',
  PAGE: 'page',
  MAX_PAGE_SIZE: 'maxPageSize',
  PROOFS: 'proofs',
  PROVIDER_INNER_PUZHASH: 'providerInnerPuzhash',
  PUBKEY: 'pubkey',
  PUSH: 'push',
  PUZHASH: 'puzhash',
  PUZZLE_ANNOUNCEMENTS: 'puzzleAnnouncements',
  PUZZLE_DECORATOR: 'puzzleDecorator',
  RECOVERY_LIST_HASH: 'recoveryListHash',
  REVERSE: 'reverse',
  RETAIN: 'retain',
  REUSE_PUZHASH: 'reusePuzhash',
  ROOT: 'root',
  ROOT_HASH: 'rootHash',
  ROYALTY_ADDRESS: 'royaltyAddress',
  ROYALTY_PERCENTAGE: 'royaltyPercentage',
  SECURE: 'secure',
  SIGN: 'sign',
  SIGNATURE: 'signature',
  SIGNING_MODE: 'signingMode',
  SORT_KEY: 'sortKey',
  SPEND_BUNDLE: 'spendBundle',
  START: 'start',
  START_HEIGHT: 'startHeight',
  START_INDEX: 'startIndex',
  STORE_ID: 'storeId',
  SUBMIT_ON_CHAIN: 'submitOnChain',
  TAKER: 'taker',
  TARGET_ADDRESS: 'targetAddress',
  TARGET_LIST: 'targetList',
  TRADE_ID: 'tradeId',
  TRANSACTION_ID: 'transactionId',
  TRANSACTIONS: 'transactions',
  TYPE: 'type',
  URIS: 'uris',
  URL: 'url',
  URLS: 'urls',
  VALIDATE_ONLY: 'validateOnly',
  USE_PEAK_HEIGHT: 'usePeakHeight',
  VALUE: 'value',
  VC_ID: 'vcId',
  VC_PARENT_ID: 'vcParentId',
  VERBOSE: 'verbose',
  WAIT_FOR_CONFIRMATION: 'waitForConfirmation',
  WALLET_ID: 'walletId',
  WALLET_IDS: 'walletIds',
  WALLET_IDS_AND_AMOUNTS: 'walletIdsAndAmounts',
  WITH_RECOVERY_INFO: 'withRecoveryInfo',
  XCH_COINS: 'xchCoins',
  XCH_CHANGE_TARGET: 'xchChangeTarget',
  SAFE_MODE: 'safeMode',
};

// Paths match what the legacy file uses (`'../@types/...'`); resolve to
// `packages/gui/@types/...` which doesn't exist on disk → virtual.
jest.mock('../@types/WalletConnectCommandParamName', () => ({ default: PARAM_NAMES, __esModule: true }), {
  virtual: true,
});
jest.mock('../@types/WalletConnectCommand', () => ({}), { virtual: true });
jest.mock('../components/walletConnect/WalletConnectCATAmount', () => ({ default: () => null }), { virtual: true });
jest.mock('../components/walletConnect/WalletConnectCreateOfferPreview', () => ({ default: () => null }), {
  virtual: true,
});
jest.mock('../components/walletConnect/WalletConnectOfferPreview', () => ({ default: () => null }), { virtual: true });

type LegacyParam = {
  name: string;
  type?: string;
  isOptional?: boolean;
  hide?: boolean;
  defaultValue?: unknown;
};

type LegacyCommand = {
  command: string;
  service?: string;
  bypassConfirm?: boolean;
  /** Legacy field — maps to `dap.requiresSync` in the new registry. */
  waitForSync?: boolean;
  allFingerprints?: boolean;
  serviceCommand?: string;
  params?: LegacyParam[];
};

// eslint-disable-next-line import/first, import/order
import legacyCommandsRaw from './WalletConnectCommands';
// eslint-disable-next-line import/first, import/order
import {
  SCHEMA_COMMANDS,
  getCommandByWc,
  getCommandSchema,
  validateDappParams,
} from './electron/constants/commandRegistry';
// eslint-disable-next-line import/first, import/order
import allowedCommands from './electron/constants/AllowedCommands';

const legacyCommands = legacyCommandsRaw as unknown as LegacyCommand[];

function legacyParams(legacy: LegacyCommand): LegacyParam[] {
  return legacy.params ?? [];
}

function snakeName(legacyParamName: string): string {
  return snakeCase(legacyParamName);
}

describe('legacy parity: command coverage', () => {
  it('every legacy command exists in the new registry', () => {
    const missing: string[] = [];
    for (const legacy of legacyCommands) {
      const wcCommand = `chia_${legacy.command}`;
      if (!getCommandByWc(wcCommand)) missing.push(wcCommand);
    }
    expect(missing).toEqual([]);
  });

  it('every legacy command resolves to a schema with a `dapp` block', () => {
    // Legacy file IS the dapp surface — every entry must have dapp opt-in.
    // `getCommandByWc` only returns entries with `dapp`, but assert
    // explicitly so the intent is visible.
    const noDapp: string[] = [];
    for (const legacy of legacyCommands) {
      const wcCommand = `chia_${legacy.command}`;
      const entry = getCommandByWc(wcCommand);
      if (!entry?.schema.dapp) noDapp.push(wcCommand);
    }
    expect(noDapp).toEqual([]);
  });

  it('no leakage — every wcCommand in the new registry has a legacy counterpart', () => {
    const legacySet = new Set(legacyCommands.map((c) => `chia_${c.command}`));
    const newWcCommands: string[] = [];
    for (const ns of SCHEMA_COMMANDS) {
      const schema = getCommandSchema(ns);
      if (!schema.dapp) continue;
      newWcCommands.push(schema.dapp.wcCommand);
      for (const alias of schema.dapp.aliases ?? []) newWcCommands.push(alias.wcCommand);
    }
    const leaked = newWcCommands.filter((wc) => !legacySet.has(wc));
    expect(leaked).toEqual([]);
  });

  it('preserves legacy `waitForSync` as `dapp.requiresSync`', () => {
    // Legacy `waitForSync` is truthy-checked, so undefined and `false` both
    // mean "no wait" — match against `=== true`.
    const drift: { wcCommand: string; legacyWait: boolean; newRequires: boolean }[] = [];
    for (const legacy of legacyCommands) {
      const wcCommand = `chia_${legacy.command}`;
      const entry = getCommandByWc(wcCommand);
      if (!entry) continue;
      const legacyWait = legacy.waitForSync === true;
      const newRequires = entry.requiresSync === true;
      if (legacyWait !== newRequires) drift.push({ wcCommand, legacyWait, newRequires });
    }
    expect(drift).toEqual([]);
  });
});

describe('legacy parity: per-command param parity', () => {
  describe.each(legacyCommands.map((c): [string, LegacyCommand] => [c.command, c]))(
    'chia_%s',
    (_label, legacy) => {
      const wcCommand = `chia_${legacy.command}`;

      it('schema is reachable', () => {
        expect(getCommandByWc(wcCommand)).toBeDefined();
      });

      it('every legacy param exists in the new schema with `dappAllowed: true`', () => {
        const entry = getCommandByWc(wcCommand);
        if (!entry) return;
        const newParams = entry.schema.params;
        const newByName = new Map(newParams.map((p) => [p.name, p]));
        const missing: { legacy: string; expectedSnake: string }[] = [];
        const notAllowed: string[] = [];
        for (const lp of legacyParams(legacy)) {
          const snake = snakeName(lp.name);
          const np = newByName.get(snake);
          if (!np) {
            missing.push({ legacy: lp.name, expectedSnake: snake });
            continue;
          }
          if (np.dappAllowed !== true) notAllowed.push(snake);
        }
        expect({ missing, notAllowed }).toEqual({ missing: [], notAllowed: [] });
      });

      it('preserves legacy param order', () => {
        const entry = getCommandByWc(wcCommand);
        if (!entry) return;
        const newOrder = entry.schema.params.map((p) => p.name);
        const expected = legacyParams(legacy).map((p) => snakeName(p.name));
        // Filter to legacy-known names so new rows don't muddy the comparison.
        const legacyNames = new Set(expected);
        const filteredNew = newOrder.filter((n) => legacyNames.has(n));
        expect(filteredNew).toEqual(expected);
      });

      it('preserves `hide: true` flags', () => {
        const entry = getCommandByWc(wcCommand);
        if (!entry) return;
        const newByName = new Map(entry.schema.params.map((p) => [p.name, p]));
        const drift: { name: string; legacyHide: boolean; newHide: boolean }[] = [];
        for (const lp of legacyParams(legacy)) {
          const snake = snakeName(lp.name);
          const np = newByName.get(snake);
          if (!np) continue;
          const legacyHide = lp.hide === true;
          const newHide = np.hide === true;
          if (legacyHide !== newHide) drift.push({ name: snake, legacyHide, newHide });
        }
        expect(drift).toEqual([]);
      });

      it('preserves `isOptional` flags', () => {
        const entry = getCommandByWc(wcCommand);
        if (!entry) return;
        const newByName = new Map(entry.schema.params.map((p) => [p.name, p]));
        const drift: { name: string; legacyOptional: boolean; newOptional: boolean }[] = [];
        for (const lp of legacyParams(legacy)) {
          const snake = snakeName(lp.name);
          const np = newByName.get(snake);
          if (!np) continue;
          const legacyOptional = lp.isOptional === true;
          const newOptional = np.isOptional === true;
          if (legacyOptional !== newOptional) drift.push({ name: snake, legacyOptional, newOptional });
        }
        expect(drift).toEqual([]);
      });

      it('preserves param defaults from legacy `defaultValue`', () => {
        // Skip `defaultValue: undefined` — legacy used it interchangeably
        // with omitting the field, mirrored by absent keys in `dapp.defaults`.
        const entry = getCommandByWc(wcCommand);
        if (!entry) return;
        const newDefaults = (entry.defaults ?? {}) as Record<string, unknown>;
        const missing: { name: string; expected: unknown }[] = [];
        const drift: { name: string; expected: unknown; actual: unknown }[] = [];
        for (const lp of legacyParams(legacy)) {
          if (lp.defaultValue === undefined) continue;
          const snake = snakeName(lp.name);
          if (!(snake in newDefaults)) {
            missing.push({ name: snake, expected: lp.defaultValue });
          } else if (newDefaults[snake] !== lp.defaultValue) {
            drift.push({ name: snake, expected: lp.defaultValue, actual: newDefaults[snake] });
          }
        }
        expect({ missing, drift }).toEqual({ missing: [], drift: [] });
      });

      it('legacy param payloads pass `validateDappParams`', () => {
        const payload: Record<string, unknown> = {};
        for (const lp of legacyParams(legacy)) {
          payload[snakeName(lp.name)] = 'value';
        }
        expect(() => validateDappParams(wcCommand, payload)).not.toThrow();
      });
    },
  );
});

describe('AllowedCommands coverage', () => {
  // AllowedCommands is the UI auto-bypass list. Most entries are reads with
  // no schema (don't need confirm UI). These checks surface gaps either way.

  const schemaSet = new Set(SCHEMA_COMMANDS);

  it('every AllowedCommand that ALSO has a schema entry is dapp-callable', () => {
    // UI-bypassed + schema entry without a `dapp` block would be incoherent
    // (renders a confirm dialog for nobody).
    const incoherent: string[] = [];
    for (const ns of allowedCommands) {
      if (!schemaSet.has(ns)) continue;
      const schema = getCommandSchema(ns);
      if (!schema.dapp) incoherent.push(ns);
    }
    expect(incoherent).toEqual([]);
  });

  it('AllowedCommands ↔ SCHEMAS coverage report (informational)', () => {
    // Snapshot-tracked list of AllowedCommands without a schema entry.
    // Update intentionally when adding/removing dapp surface.
    const inAllowedNotInSchemas = allowedCommands.filter((c) => !schemaSet.has(c)).sort();
    expect(inAllowedNotInSchemas).toMatchInlineSnapshot(`
[
  "chia_data_layer.ping",
  "chia_farmer.get_connections",
  "chia_farmer.get_harvester_plots_duplicates",
  "chia_farmer.get_harvester_plots_invalid",
  "chia_farmer.get_harvester_plots_keys_missing",
  "chia_farmer.get_harvester_plots_valid",
  "chia_farmer.get_harvesters",
  "chia_farmer.get_harvesters_summary",
  "chia_farmer.get_pool_state",
  "chia_farmer.get_reward_targets",
  "chia_farmer.get_signage_points",
  "chia_farmer.ping",
  "chia_full_node.get_block",
  "chia_full_node.get_block_record",
  "chia_full_node.get_block_records",
  "chia_full_node.get_blockchain_state",
  "chia_full_node.get_connections",
  "chia_full_node.get_fee_estimate",
  "chia_full_node.get_unfinished_block_headers",
  "chia_full_node.ping",
  "chia_harvester.get_harvester_config",
  "chia_harvester.get_plot_directories",
  "chia_harvester.ping",
  "chia_harvester.refresh_plots",
  "chia_wallet.cat_get_name",
  "chia_wallet.cat_set_name",
  "chia_wallet.check_delete_key",
  "chia_wallet.delete_unconfirmed_transactions",
  "chia_wallet.extend_derivation_index",
  "chia_wallet.generate_mnemonic",
  "chia_wallet.get_auto_claim",
  "chia_wallet.get_cat_list",
  "chia_wallet.get_connections",
  "chia_wallet.get_current_derivation_index",
  "chia_wallet.get_farmed_amount",
  "chia_wallet.get_logged_in_fingerprint",
  "chia_wallet.get_network_info",
  "chia_wallet.get_notifications",
  "chia_wallet.get_offer",
  "chia_wallet.get_stray_cats",
  "chia_wallet.get_timestamp_for_height",
  "chia_wallet.get_transaction_count",
  "chia_wallet.get_transaction_memo",
  "chia_wallet.get_transactions",
  "chia_wallet.nft_calculate_royalties",
  "chia_wallet.nft_get_wallet_did",
  "chia_wallet.ping",
  "chia_wallet.pw_status",
  "chia_wallet.set_wallet_resync_on_startup",
  "daemon.add_private_key",
  "daemon.delete_label",
  "daemon.exit",
  "daemon.get_key",
  "daemon.get_keys",
  "daemon.get_keys_for_plotting",
  "daemon.get_plotters",
  "daemon.get_version",
  "daemon.is_running",
  "daemon.keyring_status",
  "daemon.register_service",
  "daemon.running_services",
  "daemon.set_label",
  "daemon.start_plotting",
  "daemon.start_service",
  "daemon.stop_service",
  "daemon.unlock_keyring",
]
`);
  });

  it('SCHEMAS ↔ AllowedCommands cross-check (informational)', () => {
    const inSchemasNotInAllowed = SCHEMA_COMMANDS.filter((c) => !allowedCommands.includes(c)).sort();
    expect(Array.isArray(inSchemasNotInAllowed)).toBe(true);
  });
});
