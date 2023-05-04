import Wallet from '../services/WalletService';

export default class VCWallet extends Wallet {
  async getVC(args: { vcId: number }) {
    return this.command('vc_get_vc', args);
  }

  async getVCList(args: { start: number; count: number }) {
    return this.command('vc_get_vc_list', args);
  }

  async spendVC(args: {
    vcId: string;
    newPuzhash?: string;
    newProofHash?: string;
    providerInnerPuzhash?: string;
    fee?: number;
    reusePuzhash?: boolean;
  }) {
    return this.command('vc_spend_vc', args);
  }

  async addVCProofs(proofs: string) {
    return this.command('add_vc_proofs', { proofs });
  }

  async getProofsForRoot(root: string) {
    return this.command('get_proofs_for_root', { root });
  }

  async revokeVC(args: { vcParentId: string; fee: number; reusePuzhash: boolean }) {
    return this.command('vc_revoke_vc', args);
  }
}
