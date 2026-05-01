export type Capability = 'read' | 'watch' | 'walletCreate' | 'sign' | 'offer' | 'spend';

export const ALL_CAPABILITIES: Capability[] = ['read', 'watch', 'walletCreate', 'sign', 'offer', 'spend'];

export type CapabilityGrants = Record<Capability, boolean>;

export type SpendingMode = 'block' | 'ask' | 'auto';

export type PairGrants = {
  capabilities: CapabilityGrants;
  spendingMode: SpendingMode;
  spendingCapMojos: number;
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
  spentMojos: number;
};

export type Principal = { kind: 'ui' } | { kind: 'pair'; topic: string };

export type CommandClassification =
  | { kind: 'allow' }
  | { kind: 'capability'; capability: Capability; amountField?: string }
  | { kind: 'never' };

export type CheckResult =
  | { decision: 'allow' }
  | { decision: 'prompt'; reason: string }
  | { decision: 'deny'; reason: string };

export function emptyCapabilities(): CapabilityGrants {
  return {
    read: false,
    watch: false,
    walletCreate: false,
    sign: false,
    offer: false,
    spend: false,
  };
}
