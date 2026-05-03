export type PermissionsCapability = 'read' | 'balance' | 'innocuous' | 'sign' | 'offer' | 'spend';

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

export type PermissionsSpendingMode = 'block' | 'ask' | 'auto';

export type PermissionsPairGrants = {
  capabilities: Record<PermissionsCapability, boolean>;
  spendingMode: PermissionsSpendingMode;
  /** Mojo amount serialized as a string for precision. */
  spendingCapMojos: string;
};

export type PermissionsPairRecord = {
  topic: string;
  metadata: PermissionsPairMetadata;
  fingerprints: number[];
  createdAt: number;
  updatedAt: number;
  grants: PermissionsPairGrants;
  /** Mojo amount serialized as a string for precision. */
  spentMojos: string;
  /** WC commands (camelCase, no `chia_` prefix) the user approved at pairing. */
  allowedWcCommands: string[];
};

export type PermissionsPrincipal = { kind: 'ui' } | { kind: 'pair'; topic: string };

export type PermissionsPairContext = {
  topic: string;
  name: string;
  url?: string;
};

export type PermissionsDecision =
  | { kind: 'allow' }
  | { kind: 'prompt'; reason: string; pair?: PermissionsPairContext }
  | { kind: 'deny'; reason: string };

type PermissionsService = {
  listPairs: () => Promise<PermissionsPairRecord[]>;
  registerPair: (payload: {
    topic: string;
    metadata: PermissionsPairMetadata;
    availableWallets: PermissionsPairWallet[];
    defaultFingerprints?: number[];
    /** WC `chia_<wcCommand>` method names from the dapp's session proposal. */
    requestedMethods?: string[];
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
    /** Required when principal is a pair; identifies the per-pair allowlist entry. */
    wcCommand?: string;
  }) => Promise<PermissionsDecision>;
  dispatchAsPair: (payload: {
    destination: string;
    /** camelCase WC command name (e.g. `spendCAT`); main resolves to RPC. */
    wcCommand: string;
    data?: Record<string, unknown>;
    topic: string;
    fingerprint?: {
      requested: number;
      current?: number;
      requestedLabel?: string;
      currentLabel?: string;
    };
  }) => Promise<{ data: Record<string, unknown> }>;
};

export default PermissionsService;
