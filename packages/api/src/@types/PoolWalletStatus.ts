import PlotNFTState from '../constants/PlotNFTState';

type PoolWalletStatus = {
  current: CurrentOrTarget;
  currentInner: string;
  launcherCoin: LauncherCoin;
  launcherId: string;
  p2SingletonPuzzleHash: string;
  singletonBlockHeight: number;
  target: CurrentOrTarget | null;
  tipSingletonCoinId: string;
};
type CurrentOrTarget = {
  ownerPubkey: string;
  poolUrl: string;
  relativeLockHeight: number;
  state: PlotNFTState;
  targetPuzzleHash: string;
  version: number;
};
type LauncherCoin = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};

export default PoolWalletStatus;
