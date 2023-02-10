type FoliageBlockData = {
  extensionData: string;
  farmerRewardPuzzleHash: string;
  poolSignature: string | null;
  poolTarget: {
    maxHeight: number;
    puzzleHash: string;
  };
  unfinishedRewardBlockHash: string;
};

type Foliage = {
  foliageBlockData: FoliageBlockData;
  foliageBlockDataSignature: string;
  foliageTransactionBlockHash: string;
  foliageTransactionBlockSignature: string;
  prevBlockHash: string;
  rewardBlockHash: string;
};

export default Foliage;
