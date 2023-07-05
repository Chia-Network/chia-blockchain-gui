type Coin2 = {
  amount: number;
  coinId: string;
  coinType: number;
  confirmedHeight: number;
  metadata: {
    isRecipient: boolean;
    recipientPuzzleHash: string;
    senderPuzzleHash: string;
    timeLock: number;
  };
  parentCoin: string;
  puzzleHash: string;
  spentHeight: number;
};

export default Coin2;
