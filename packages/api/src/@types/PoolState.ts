import type BigNumber from 'bignumber.js';

type PoolState = {
  authenticationTokenTimeout: number;
  currentDifficulty: number;
  currentPoints: number;
  nextFarmerUpdate: number | BigNumber;
  nextPoolInfoUpdate: number | BigNumber;
  p2SingletonPuzzleHash: string;
  plotCount: number;
  pointsAcknowledged24H: [number, number][];
  pointsAcknowledgedSinceStart: number;
  pointsFound24H: [number, number][];
  pointsFoundSinceStart: number;
  poolConfig: {
    launcherId: string;
    ownerPublicKey: string;
    p2SingletonPuzzleHash: string;
    payoutInstructions: string;
    poolUrl: string;
    targetPuzzleHash: string;
  };
  poolErrors24H: {
    errorCode: number;
    errorMessage: string;
  }[];
};

export default PoolState;
