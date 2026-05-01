export type Capability = 'read' | 'balance' | 'innocuous' | 'sign' | 'offer' | 'spend';

export const ALL_CAPABILITIES: Capability[] = ['read', 'balance', 'innocuous', 'sign', 'offer', 'spend'];

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
  metadata: PairMetadata;
  fingerprints: number[];
  createdAt: number;
  updatedAt: number;
  grants: PairGrants;
  /** Mojo amount serialized as a string to survive JSON without precision loss. */
  spentMojos: string;
};

export type Principal = { kind: 'ui' } | { kind: 'pair'; topic: string };

import type BigNumber from 'bignumber.js';

export type AmountResolver = (payload: Record<string, unknown>) => BigNumber | undefined;

export type CommandClassification =
  | {
      kind: 'capability';
      capability: Capability;
      amountField?: string;
      feeField?: string;
      amountResolver?: AmountResolver;
    }
  | { kind: 'never' };

export type CheckResult =
  | { decision: 'allow' }
  | { decision: 'prompt'; reason: string }
  | { decision: 'deny'; reason: string };

export function emptyCapabilities(): CapabilityGrants {
  return {
    read: false,
    balance: false,
    innocuous: false,
    sign: false,
    offer: false,
    spend: false,
  };
}
