import Wallet from '../services/WalletService';

type VCType = {
  coin: {
    amount: number;
    parentCoinInfo: string;
    puzzleHash: string;
  };
  emlLineageProof: {
    amount: number;
    innerPuzzleHash: string;
    parentName: string;
    parentProofHash: string;
  };
  innerPuzzleHash: string;
  launcherId: string;
  proofHash: string;
  proofProvider: string;
  singletonLineageProof: {
    amount: number;
    innerPuzzleHash: string;
    parentName: string;
  };
};

type VCRecordType = {
  coinId: string;
  confirmedAtHeight: number;
  vc: VCType;
};

type AdditionType = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};

type RemovalType = {
  amount: number;
  parentCoinInfo: string;
  puzzleHash: string;
};

type CoinSpendsType = {
  coin: {
    amount: number;
    parentCoinInfo: string;
    puzzleHash: string;
  };
  puzzleReveal: string;
  solution: string;
};

type TransactionType = {
  additions: AdditionType[];
  amount: number;
  confirmed: boolean;
  confirmedAtHeight: number;
  createdAtTime: number;
  feeAmount: number;
  memos: Record<string, string>;
  name: string;
  removals: RemovalType[];
  sent: number;
  sentTo: string[];
  spendBundle: {
    aggregatedSignature: string;
    coinSpends: CoinSpendsType[];
  };
  toAddress: string;
  toPuzzleHash: string;
  tradeId: string;
  type: number;
  walletId: number;
};

export default class VCWallet extends Wallet {
  async getVC(args: { vcId: number }) {
    return this.command<{
      success: boolean;
      vcRecord: VCType;
    }>('vc_get_vc', args);
  }

  async getVCList(args: { start: number; count: number }) {
    return this.command<{
      proofs: any;
      success: boolean;
      vcRecords: VCRecordType[];
    }>('vc_get_vc_list', args);
  }

  async spendVC(args: {
    vcId: string;
    newPuzhash?: string;
    newProofHash?: string;
    providerInnerPuzhash?: string;
    fee?: number;
    reusePuzhash?: boolean;
  }) {
    return this.command<{
      success: boolean;
      transactions: TransactionType[];
    }>('vc_spend_vc', args);
  }

  async addVCProofs(proofs: string) {
    return this.command<{
      proofs: any;
    }>('add_vc_proofs', { proofs });
  }

  async getProofsForRoot(root: string) {
    return this.command<{ proofs: any }>('get_proofs_for_root', { root });
  }

  async revokeVC(args: { vcParentId: string; fee: number; reusePuzhash: boolean }) {
    return this.command<{
      transactions: TransactionType[];
    }>('vc_revoke_vc', args);
  }
}
