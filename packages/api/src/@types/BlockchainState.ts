type MempoolMinFees = {
  cost5000000: number;
};
type Peak = {
  challengeBlockInfoHash: string;
  challengeVdfOutput: ChallengeVdfOutputOrInfusedChallengeVdfOutput;
  deficit: number;
  farmerPuzzleHash: string;
  fees: number | null;
  finishedChallengeSlotHashes: string | null;
  finishedInfusedChallengeSlotHashes: string | null;
  finishedRewardSlotHashes: string | null;
  headerHash: string;
  height: number;
  infusedChallengeVdfOutput: ChallengeVdfOutputOrInfusedChallengeVdfOutput;
  overflow: boolean;
  poolPuzzleHash: string;
  prevHash: string;
  prevTransactionBlockHash: string;
  prevTransactionBlockHeight: number | null;
  requiredIters: number;
  rewardClaimsIncorporated: RewardClaimsIncorporatedEntity[] | null;
  rewardInfusionNewChallenge: string;
  signagePointIndex: number;
  subEpochSummaryIncluded: string | null;
  subSlotIters: number;
  timestamp: number | null;
  totalIters: number;
  weight: number;
};
type ChallengeVdfOutputOrInfusedChallengeVdfOutput = {
  data: string;
};
type RewardClaimsIncorporatedEntity = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};
type Sync = {
  syncMode: boolean;
  syncProgressHeight: number;
  syncTipHeight: number;
  synced: boolean;
};

type BlockchainState = {
  blockMaxCost: number;
  difficulty: number;
  genesisChallengeInitialized: boolean;
  mempoolCost: number;
  mempoolFees: number;
  mempoolMaxTotalCost: number;
  mempoolMinFees: MempoolMinFees;
  mempoolSize: number;
  nodeId: string;
  peak: Peak;
  space: number;
  averageBlockTime: number;
  subSlotIters: number;
  sync: Sync;
};
export default BlockchainState;
