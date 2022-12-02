type WalletConnectNamespaces = Record<
  string,
  {
    accounts: string[];
    events: string[];
    methods: string[];
  }
>;

export default WalletConnectNamespaces;
