type CATToken = {
  assetId: string;
  name: string;
  symbol: string;
};

export default CATToken;

export type CATTokenStray = {
  assetId: string;
  name: string;
  firstSeenHeight: number;
  senderPuzzleHash: string;
};
