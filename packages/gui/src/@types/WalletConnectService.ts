import type {
  ScopePolicy,
  SessionScopes,
} from '../constants/WalletConnectScopes';

export type WalletConnectSessionMetadata = {
  name?: string;
  url?: string;
  description?: string;
  icons?: string[];
  iconHash?: string;
};

export type WalletConnectLedgerEntry = {
  ts: number;
  amount: string;
  fee: string;
  txId?: string;
  command?: string;
};

export type StoredWalletConnectSession = {
  topic: string;
  metadata: WalletConnectSessionMetadata;
  fingerprint?: number;
  scopes: SessionScopes;
  ledger: Partial<Record<string, WalletConnectLedgerEntry[]>>;
  createdAt: number;
  updatedAt: number;
};

export type PutWalletConnectSessionInput = {
  topic: string;
  metadata?: WalletConnectSessionMetadata;
  fingerprint?: number;
  scopes?: SessionScopes;
};

export type PromptPermissionsInput = {
  topic: string;
  requestedCommands: string[];
  metadata: WalletConnectSessionMetadata;
};

export type PromptPermissionsResult = {
  approved: boolean;
  scopes?: SessionScopes;
};

export type WalletConnectService = {
  listSessions(): Promise<StoredWalletConnectSession[]>;
  getSession(topic: string): Promise<StoredWalletConnectSession | undefined>;
  putSession(input: PutWalletConnectSessionInput): Promise<StoredWalletConnectSession>;
  revokeSession(topic: string): Promise<boolean>;
  setScopes(topic: string, scopes: SessionScopes): Promise<StoredWalletConnectSession>;
  getLedger(topic: string, scope: string, sinceTs?: number): Promise<WalletConnectLedgerEntry[]>;
  resetLedger(topic: string, scope?: string): Promise<void>;
  promptPermissions(input: PromptPermissionsInput): Promise<PromptPermissionsResult>;
  isMigrated(): Promise<boolean>;
  markMigrated(): Promise<void>;
  getUsdRate(): Promise<number | undefined>;
};

export type { ScopePolicy, SessionScopes };
