import type WalletConnectMetadata from './WalletConnectMetadata';
import type WalletConnectNamespaces from './WalletConnectNamespaces';

export type PendingProposal = {
  id: number;
  proposerMetadata?: WalletConnectMetadata;
  methods: string[];
  events: string[];
  chains: string[];
};

// Renderer-only pair record — strictly transient WC SDK state. The
// persistent / security-relevant copy lives in `dapp-pairs.yaml` (main),
// accessed through `permissionsAPI.getPairs`. Anything that needs to
// survive an app restart, or that the gate has to trust, belongs there,
// not here. Fingerprints in particular live exclusively on main's
// PairRecord — the renderer doesn't need them for any decision.
type Pair = {
  topic: string;
  sessions: {
    topic: string;
    metadata?: WalletConnectMetadata;
    namespaces: WalletConnectNamespaces;
  }[];
  metadata?: WalletConnectMetadata;
  pendingProposal?: PendingProposal;
};

export default Pair;
