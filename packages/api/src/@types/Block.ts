import type Foliage from './Foliage';
import type FoliageTransactionBlock from './FoliageTransactionBlock';

type ChainSpProof = {
  normalizedToIdentity: boolean;
  witness: string;
  witnessType: number;
};
type FinishedSubSlots = {
  challengeChain: any;
  infusedChallengeChain: any;
  rewardChain: any;
  proofs: any;
};

type ChallengeOrRewardsChainVdf = {
  challenge: string;
  numberOfIterations: number;
  output: {
    data: string;
  };
};

type ProofOfSpace = {
  challenge: string;
  plotPublicKey: string;
  poolContractPuzzleHash: string;
  poolPublicKey: string | null;
  proof: string;
  size: number;
};
type RewardChainBlock = {
  challengeChainIpVdf?: ChallengeOrRewardsChainVdf;
  challengeChainSpSignature: string;
  challengeChainSpVdf: ChallengeOrRewardsChainVdf;
  height?: number;
  infusedChallengeChainIpVdf?: ChallengeOrRewardsChainVdf | null;
  isTransactionBlock?: boolean;
  posSsCcChallengeHash: string;
  proofOfSpace: ProofOfSpace;
  rewardChainIpVdf?: ChallengeOrRewardsChainVdf;
  rewardChainSpSignature: string;
  rewardChainSpVdf: ChallengeOrRewardsChainVdf;
  signagePointIndex: number;
  totalIters: number;
  weight?: number;
};

type TransactionsInfo = {
  aggregatedSignature: string;
  cost: number;
  fees: number;
  generatorRefsRoot: string;
  generatorRoot: string;
  rewardClaimsIncorporated?: RewardClaimsIncorporatedEntity[] | null;
};
type RewardClaimsIncorporatedEntity = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};

type Block = {
  challengeChainIpProof: ChainSpProof;
  challengeChainSpProof: ChainSpProof;
  finishedSubSlots: FinishedSubSlots[];
  foliage: Foliage;
  foliageTransactionBlock: FoliageTransactionBlock;
  infusedChallengeChainIpProof?: null;
  rewardChainBlock: RewardChainBlock;
  rewardChainIpProof: ChainSpProof;
  rewardChainSpProof: ChainSpProof;
  transactionsGenerator: string;
  transactionsGeneratorRefList?: number[] | null;
  transactionsInfo: TransactionsInfo;
};

export default Block;
