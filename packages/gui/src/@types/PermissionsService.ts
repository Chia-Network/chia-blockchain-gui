import NotificationType from '../constants/NotificationType';

export type PermissionsPairMetadata = {
  name: string;
  url?: string;
  icon?: string;
  description?: string;
};

/** Renderer-safe pair view returned over `permissionsAPI`. */
export type PermissionsPairRecord = {
  topic: string;
  mainnet: boolean;
  metadata: PermissionsPairMetadata;
  fingerprint: number;
  /** Wire form `chia_<name>`. Granted at pairing; empty = deny-all. */
  commands: string[];
  /** Whether this pair has any command-level "always allow" overrides. */
  hasBypass: boolean;
};

export type PermissionsCommandMetadata = {
  requiresSync: boolean;
};

/**
 * Wire-safe shape main sends over the `permissions:notification` event
 * after a paired dapp's `chia_showNotification` passed the gate. Renderer
 * routes this to its own notification system. Subset of the renderer's
 * shared `Notification` type — only the variants main can construct.
 *
 * Discriminators use `NotificationType` directly (not string literals) so
 * main's producer and the renderer's consumer stay coupled at compile time.
 * If the enum is ever renumbered or renamed, TS flags both sides instead of
 * silently dropping notifications at runtime.
 */
export type PermissionsNotificationPayload =
  | {
      type: NotificationType.OFFER;
      timestamp: number;
      id: string;
      source: 'WALLET_CONNECT';
      fingerprints?: number[];
      from?: string;
      offerData: string;
    }
  | {
      type: NotificationType.ANNOUNCEMENT;
      timestamp: number;
      id: string;
      source: 'WALLET_CONNECT';
      fingerprints?: number[];
      from?: string;
      message: string;
      url?: string;
    };

type PermissionsService = {
  findPair: (topic: string) => Promise<PermissionsPairRecord | undefined>;
  getPairs: () => Promise<PermissionsPairRecord[]>;
  registerPair: (payload: {
    topic: string;
    mainnet: boolean;
    metadata: PermissionsPairMetadata;
    /** WC commands from the dapp's session proposal, wire form `chia_<name>`. */
    commands: string[];
  }) => Promise<PermissionsPairRecord | null>;
  editPair: (topic: string) => Promise<PermissionsPairRecord | null>;
  revokePair: (topic: string) => Promise<void>;
  resetPairBypass: (topic: string) => Promise<void>;
  resetAllPairBypasses: () => Promise<void>;
  getCommandMetadata: (command: string) => Promise<PermissionsCommandMetadata | undefined>;
  subscribeForNotifications: (callback: (notification: PermissionsNotificationPayload) => void) => () => void;
  dispatchAsPair: (payload: {
    topic: string;
    command: string;
    // serialized params because of bigints
    params: string;
  }) => Promise<string>;
};

export default PermissionsService;
