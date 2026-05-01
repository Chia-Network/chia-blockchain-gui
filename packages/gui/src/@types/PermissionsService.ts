export type PermissionsCapability = 'read' | 'watch' | 'walletCreate' | 'sign' | 'offer' | 'spend';

export type PermissionsPairMetadata = {
  name: string;
  url?: string;
  icon?: string;
  description?: string;
};

export type PermissionsPairWallet = {
  fingerprint: number;
  name?: string;
};

export type PermissionsPairGrants = {
  capabilities: Record<PermissionsCapability, boolean>;
  spendingCapMojos: number;
};

export type PermissionsPairRecord = {
  topic: string;
  metadata: PermissionsPairMetadata;
  fingerprints: number[];
  createdAt: number;
  updatedAt: number;
  grants: PermissionsPairGrants;
  spentMojos: number;
};

export type PermissionsPrincipal = { kind: 'ui' } | { kind: 'pair'; topic: string };

export type PermissionsCheckResult =
  | { decision: 'allow' }
  | { decision: 'prompt'; reason: string }
  | { decision: 'deny'; reason: string };

type PermissionsService = {
  listPairs: () => Promise<PermissionsPairRecord[]>;
  registerPair: (payload: {
    topic: string;
    metadata: PermissionsPairMetadata;
    availableWallets: PermissionsPairWallet[];
    defaultFingerprints?: number[];
  }) => Promise<PermissionsPairRecord | null>;
  editPair: (payload: {
    topic: string;
    availableWallets: PermissionsPairWallet[];
  }) => Promise<PermissionsPairRecord | null>;
  revokePair: (topic: string) => Promise<boolean>;
  check: (payload: {
    principal: PermissionsPrincipal;
    command: string;
    data: Record<string, unknown>;
  }) => Promise<PermissionsCheckResult>;
};

export default PermissionsService;
