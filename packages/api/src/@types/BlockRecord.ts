type ChallengeVdfOutput = {
  data: string;
};

type RewardClaimIncorporated = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};

type BlockRecord = {
  challengeBlockInfoHash: string;
  challengeVdfOutput: ChallengeVdfOutput;
  deficit: number;
  farmerPuzzleHash: string;
  fees: number;
  finishedChallengeSlotHashes: string | null;
  finishedInfusedChallengeSlotHashes: string | null;
  finishedRewardSlotHashes: string | null;
  headerHash: string;
  height: number;
  infusedChallengeVdfOutput: any;
  overflow: boolean;
  poolPuzzleHash: string;
  prevHash: string;
  prevTransactionBlockHash: string | null;
  prevTransactionBlockHeight: number;
  requiredIters: number;
  rewardClaimsIncorporated: RewardClaimIncorporated[] | null;
  rewardInfusionNewChallenge: string;
  signagePointIndex: number;
  subEpochSummaryIncluded: string | null;
  subSlotIters: number;
  timestamp: number | null;
  totalIters: number;
  weight: number;
};

export default BlockRecord;
