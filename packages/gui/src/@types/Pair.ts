import type WalletConnectMetadata from './WalletConnectMetadata';
import type WalletConnectNamespaces from './WalletConnectNamespaces';

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
};

export default Pair;
