import Wallet from '../services/WalletService';

export default class VCWallet extends Wallet {
  async getVC(vcId: string) {
    return this.command('vc_get_vc', {
      vc_id: vcId,
    });
  }

  async getVCList({ start, count }: { start: number; count: number }) {
    return this.command('vc_get_vc_list', {
      start,
      count,
    });
  }

  async spendVC({
    vcId,
    newPuzhash,
    newProofHash,
    providerInnerPuzhash,
    fee,
    reusePuzhash,
  }: {
    vcId: string;
    newPuzhash?: string;
    newProofHash?: string;
    providerInnerPuzhash?: string;
    fee?: number;
    reusePuzhash?: boolean;
  }) {
    return this.command('vc_spend_vc', {
      vc_id: vcId,
      new_puzhash: newPuzhash,
      new_proof_hash: newProofHash,
      provider_inner_puzhash: providerInnerPuzhash,
      fee,
      reuse_puzhash: reusePuzhash,
    });
  }

  async addVCProofs(proofs: string) {
    return this.command('add_vc_proofs', { proofs });
  }

  async getProofsForRoot(root: string) {
    return this.command('get_proofs_for_root', { root });
  }

  async revokeVC({ vcParentId, fee, reusePuzhash }: { vcParentId: string; fee: number; reusePuzhash: boolean }) {
    return this.command('vc_revoke_vc', {
      vc_parent_id: vcParentId,
      fee,
      reuse_puzhash: reusePuzhash,
    });
  }
}
