type Pair = {
  topic: string;
  mainnet: boolean;
  fingerprints: number[];
  sessions: string[];
  application?: string;
  namespaces: {};
};

export default Pair;
