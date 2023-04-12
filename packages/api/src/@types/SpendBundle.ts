// import type CoinSolution from './CoinSolution';
import type G2Element from './G2Element';

type CoinSpends = {
  coin: Coin;
  puzzleReveal: string;
  solution: string;
};
type Coin = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};

type SpendBundle = {
  coinSpends: CoinSpends[];
  // coinSolutions: CoinSolution[];
  aggregatedSignature: G2Element;
};

export default SpendBundle;
