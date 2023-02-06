import type PoolInfo from './PoolInfo';

type PoolState = {
  p2SingletonPuzzleHash: string;
  pointsFoundSinceStart: number;
  pointsFound24h: [number, number][];
  pointsAcknowledgedSinceStart: number;
  pointsAcknowledged24h: [number, number][];
  currentPoints: number;
  currentDifficulty: number;
  plotCount: number;
  poolErrors24h: {
    currentDifficulty: number;
    errorCode: number;
    errorMessage: string;
  }[];
  poolInfo: PoolInfo;
  poolConfig: {
    authenticationKeyInfoSignature: string;
    authenticationPublicKey: string;
    authenticationPublicKeyTimestamp: number;
    ownerPublicKey: string;
    poolPuzzleHash: string;
    poolUrl: string;
    launcherId: string;
    target: string;
    targetSignature: string;
    payoutInstructions: string;
    targetPuzzleHash: string;
  };
};

export default PoolState;
