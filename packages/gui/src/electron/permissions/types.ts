import type BigNumber from 'bignumber.js';

export type PairGrants = {
  /** XCH mojos auto-approved per pair when the command is not bypassed. `'0'` = prompt unless bypassed. */
  allowanceMojos: string;
};

export type PairMetadata = {
  name: string;
  url?: string;
  icon?: string;
  description?: string;
};

export type PairRecord = {
  topic: string;
  mainnet: boolean;
  metadata: PairMetadata;
  fingerprints: number[];
  createdAt: number;
  updatedAt: number;
  grants: PairGrants;
  /** Mojos debited from `grants.allowanceMojos`. */
  usedMojos: string;
  /** Wire form `chia_<name>`. Granted at pairing; empty = deny-all. */
  commands: string[];
  /**
   * Per-wcCommand "always allow" list. Spend-class wcCommands can be listed
   * here for exact command-level trust; otherwise they fall back to
   * `grants.allowanceMojos`.
   */
  bypass: string[];
};

export type Principal = { kind: 'ui' } | { kind: 'pair'; topic: string };

export type AmountResolver = (
  payload: Record<string, unknown>,
) => BigNumber | undefined | Promise<BigNumber | undefined>;

export type SpendClassification = {
  capability: 'spend' | 'offer';
  amountField?: string;
  feeField?: string;
  amountResolver?: AmountResolver;
};

/** Subset of PairRecord safe to expose across boundaries. */
export type PairContext = {
  topic: string;
  name: string;
  url?: string;
  icon?: string;
  description?: string;
};

// allow.commit() debits the spend; idempotent so duplicate calls don't double-charge.
export type Decision =
  | { kind: 'allow'; commit: () => void }
  | { kind: 'prompt'; reason: string; pair?: PairContext }
  | { kind: 'deny'; reason: string };
