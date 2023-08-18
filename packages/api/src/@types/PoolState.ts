import type BigNumber from 'bignumber.js';

type PoolState = {
  authenticationTokenTimeout: number | null;
  currentDifficulty: number | null;
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
  poolErrors24H: Array<
    [
      number,
      {
        errorCode: number;
        errorMessage: string;
      }
    ]
  >;
  validPartialsSinceStart: number;
  validPartials24h: Array<[number, number]>;
  invalidPartialsSinceStart: number;
  invalidPartials24h: Array<[number, number]>;
  stalePartialsSinceStart: number;
  stalePartials24h: Array<[number, number]>;
  missingPartialsSinceStart: number;
  missingPartials24h: Array<[number, number]>;
};

export default PoolState;
