export type PermissionsCapability = 'balance' | 'innocuous' | 'sign' | 'offer' | 'spend';

export type PermissionsPairMetadata = {
  name: string;
  url?: string;
  icon?: string;
  description?: string;
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
  mainnet: boolean;
  metadata: PermissionsPairMetadata;
  fingerprints: number[];
  createdAt: number;
  updatedAt: number;
  grants: PermissionsPairGrants;
  /** Mojo amount serialized as a string for precision. */
  spentMojos: string;
  /** WC commands (wire form, `chia_<name>`) the user approved at pairing. */
  commands: string[];
  /** WC commands marked "don't ask again" — main short-circuits prompts. */
  bypass: string[];
};

export type PermissionsCommandMetadata = {
  /** Wire-form WC command name (`chia_<name>`). */
  wcCommand: string;
  /** Resolved label string in the current locale (when the schema declares one). */
  label?: string;
  /** Resolved description string in the current locale. */
  description?: string;
  /** Whether the renderer should wait for wallet sync before dispatching. */
  requiresSync: boolean;
};

/**
 * Wire-safe shape main sends over the `permissions:notification` event
 * after a paired dapp's `chia_showNotification` passed the gate. Renderer
 * routes this to its own notification system. Subset of the renderer's
 * shared `Notification` type — only the variants main can construct.
 */
export type PermissionsNotificationPayload =
  | {
      type: 'offer';
      timestamp: number;
      id: string;
      source: 'WALLET_CONNECT';
      fingerprints?: number[];
      from?: string;
      offerData: string;
    }
  | {
      type: 'announcement';
      timestamp: number;
      id: string;
      source: 'WALLET_CONNECT';
      fingerprints?: number[];
      from?: string;
      message: string;
      url?: string;
    };

type PermissionsService = {
  listPairs: () => Promise<PermissionsPairRecord[]>;
  registerPair: (payload: {
    topic: string;
    mainnet: boolean;
    metadata: PermissionsPairMetadata;
    /** WC commands from the dapp's session proposal, wire form `chia_<name>`. */
    requestedCommands?: string[];
  }) => Promise<PermissionsPairRecord | null>;
  editPair: (payload: { topic: string }) => Promise<PermissionsPairRecord | null>;
  revokePair: (topic: string) => Promise<boolean>;
  setBypass: (payload: {
    topic: string;
    wcCommand: string;
    enabled: boolean;
  }) => Promise<PermissionsPairRecord | null>;
  resetBypass: (topic: string) => Promise<PermissionsPairRecord | null>;
  resetBypassAll: () => Promise<boolean>;
  resetSpent: (topic: string) => Promise<PermissionsPairRecord | null>;
  commandsMetadata: () => Promise<PermissionsCommandMetadata[]>;
  /**
   * Subscribe to `chia_showNotification` payloads from main. Main fires
   * after the gate passes; renderer routes to its notification system.
   * Returns an unsubscribe function.
   */
  subscribeToNotification: (
    callback: (event: unknown, notification: PermissionsNotificationPayload) => void,
  ) => () => void;
  dispatchAsPair: (payload: {
    /** camelCase WC command name (e.g. `spendCAT`); main resolves to
     *  destination + RPC via the registry. Renderer is not trusted to
     *  claim a destination. */
    wcCommand: string;
    data?: Record<string, unknown>;
    topic: string;
    /** Chain id from the dapp's WC chainId — main validates against the pair. */
    mainnet: boolean;
    fingerprint?: {
      requested: number;
      current?: number;
      requestedLabel?: string;
      currentLabel?: string;
    };
  }) => Promise<{ data: Record<string, unknown> }>;
};

export default PermissionsService;
