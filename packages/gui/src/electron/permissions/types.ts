export type CapabilityGrants = Record<
  'balance' | 'innocuous' | 'sign' | 'offer' | 'spend' | 'notifications',
  boolean
>;

export type SpendingMode = 'block' | 'ask' | 'auto';

export type PairGrants = {
  capabilities: CapabilityGrants;
  spendingMode: SpendingMode;
  /** String-encoded for BigNumber-safe JSON. */
  spendingCapMojos: string;
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
  /** String-encoded for BigNumber-safe JSON. */
  spentMojos: string;
  /** Wire form `chia_<name>`. Granted at pairing; empty = deny-all. */
  commands: string[];
  /** Wire form. "Don't ask again" list — gate skips the prompt for these. */
  bypass: string[];
};

export type Principal = { kind: 'ui' } | { kind: 'pair'; topic: string };

import type BigNumber from 'bignumber.js';

export type AmountResolver = (payload: Record<string, unknown>) => BigNumber | undefined;

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

export function emptyCapabilities(): CapabilityGrants {
  return {
    balance: false,
    innocuous: false,
    sign: false,
    offer: false,
    spend: false,
    notifications: false,
  };
}
