import type WalletConnectMetadata from './WalletConnectMetadata';
import type WalletConnectNamespaces from './WalletConnectNamespaces';

export type PendingProposal = {
  id: number;
  proposerMetadata?: WalletConnectMetadata;
  methods: string[];
  events: string[];
  chains: string[];
};

type Pair = {
  topic: string;
  mainnet: boolean;
  fingerprints: number[];
  sessions: {
    topic: string;
    metadata?: WalletConnectMetadata;
    namespaces: WalletConnectNamespaces;
  }[];
  metadata?: WalletConnectMetadata;
  bypassCommands?: Record<string, boolean>;
  pendingProposal?: PendingProposal;
};

export default Pair;
