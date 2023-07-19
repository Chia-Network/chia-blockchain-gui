import BigNumber from 'bignumber.js';

type FarmingInfo = {
  challengeHash: string;
  totalPlots: number;
  foundProofs: number;
  eligiblePlots: number;
  time: BigNumber;
};

export default FarmingInfo;
