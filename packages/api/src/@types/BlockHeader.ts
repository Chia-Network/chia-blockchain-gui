import type Block from './Block';

type BlockHeader = Pick<
  Block,
  | 'challengeChainSpProof'
  | 'finishedSubSlots'
  | 'rewardChainBlock'
  | 'rewardChainSpProof'
  | 'foliage'
  | 'foliageTransactionBlock'
> & { transactionsFilter: string };

export default BlockHeader;

// type ChainSpProof = {
//   normalizedToIdentity: boolean;
//   witness: string;
//   witnessType: number;
// };

// type FinishedSubSlots = {
//   challengeChain: any;
//   infusedChallengeChain: any;
//   rewardChain: any;
//   proofs: any;
// };

// type ChallengeChainSpVdf = {
//   challenge: string;
//   numberOfIterations: number;
//   output: {
//     data: string;
//   };
// };

// type ProofOfSpace = {
//   challenge: string;
//   plotPublicKey: string;
//   poolContractPuzzleHash: string;
//   poolPublicKey: string | null;
//   proof: string;
//   size: number;
// };

// type RewardChainBlock = {
//   challengeChainSpSignature: string;
//   challengeChainSpVdf: ChallengeChainSpVdf;
//   posSsCcChallengeHash: string;
//   proofOfSpace: ProofOfSpace;
//   rewardChainSpSignature: string;
//   rewardChainSpVdf: ChallengeChainSpVdf;
//   signagePointIndex: number;
//   totalIters: number;
// };

// type BlockHeader = {
//   challengeChainSpProof: ChainSpProof;
//   finishedSubSlots: FinishedSubSlots[];
//   rewardChainBlock: RewardChainBlock;
//   rewardChainSpProof: ChainSpProof;
//   foliage: Foliage;
//   foliageTransactionBlock: FoliageTransactionBlock;
//   transactionsFilter: string;
// };
