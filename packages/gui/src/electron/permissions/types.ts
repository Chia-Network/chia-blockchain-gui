export type Capability = 'balance' | 'innocuous' | 'sign' | 'offer' | 'spend' | 'notifications';

export const ALL_CAPABILITIES: Capability[] = [
  'balance',
  'innocuous',
  'sign',
  'offer',
  'spend',
  'notifications',
];

export type CapabilityGrants = Record<Capability, boolean>;

export type SpendingMode = 'block' | 'ask' | 'auto';

export type PairGrants = {
  capabilities: CapabilityGrants;
  spendingMode: SpendingMode;
  /** Mojo amount serialized as a string to survive JSON without precision loss. */
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
  /** mainnet vs testnet — captured at pairing, used by `client.approve` to
   *  build the `chia:<instance>` chain id. */
  mainnet: boolean;
  metadata: PairMetadata;
  fingerprints: number[];
  createdAt: number;
  updatedAt: number;
  grants: PairGrants;
  /** Mojo amount serialized as a string to survive JSON without precision loss. */
  spentMojos: string;
  /**
   * WC method names (wire form `chia_<name>`) the user approved at pairing.
   * The intersection of (what the dapp asked for) ∩ (what the registry
   * recognizes). Empty list means the dapp can call nothing — including
   * for legacy records that predate this field, where reading absence as
   * deny-all is the safe default.
   */
  commands: string[];
  /**
   * WC method names (wire form) the user marked "don't ask again" via the
   * Confirm dialog or the Settings/Integration UI. Main's gate short-
   * circuits to `allow` for these (still respecting `block` spending mode
   * and the cap, so bypass doesn't override budget).
   */
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

/** Dialog-shaped pair info. Never leak full PairRecord across boundaries. */
export type PairContext = {
  topic: string;
  name: string;
  url?: string;
  icon?: string;
  description?: string;
};

/**
 * Result of a single permission resolution. The caller binds the side effect
 * to the decision: `allow.commit()` debits the already-resolved spend amount;
 * idempotent so a duplicate call is a no-op rather than a double-charge.
 */
export type Decision =
  | { kind: 'allow'; commit: () => void }
  | { kind: 'prompt'; reason: string; pair?: PairContext }
  | { kind: 'deny'; reason: string };

/** IPC-safe variant. The commit thunk is stripped before crossing the wire. */
export type DecisionWire =
  | { kind: 'allow' }
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
