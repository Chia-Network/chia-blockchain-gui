import type BigNumber from 'bignumber.js';

import type { Transaction } from '../@types';
import type SpendBundle from '../@types/SpendBundle';
import type Message from '../Message';
import Wallet from '../services/WalletService';

export default class DIDWallet extends Wallet {
  async createNewDIDWallet(args: { amount: string; fee: string; backupDids: string; numOfBackupIdsNeeded: number }) {
    return this.createNewWallet({
      walletType: 'did_wallet',
      options: {
        did_type: 'new',
        ...args,
      },
    });
  }

  async createNewRecoveryWallet(args: { filename: string }) {
    return this.createNewWallet({
      walletType: 'did_wallet',
      options: {
        did_type: 'recovery',
        ...args,
      },
    });
  }

  async updateRecoveryIds(args: { walletId: number; newList: string[]; numVerificationsRequired: boolean }) {
    return this.command<void>('did_update_recovery_ids', args);
  }

  async getPubKey(args: { walletId: number }) {
    return this.command<{
      pubkey: string;
    }>('did_get_pubkey', args);
  }

  async getDid(args: { walletId: number }) {
    return this.command<{
      walletId: number;
      myDid: string;
      coinId: string;
    }>('did_get_did', args);
  }

  async getDidName(args: { walletId: number }) {
    return this.command<{
      walletId: number;
      name: string;
    }>('did_get_wallet_name', args);
  }

  async setDIDName(args: { walletId: number; name: string }) {
    return this.command<{
      walletId: number;
    }>('did_set_wallet_name', args);
  }

  async getRecoveryList(args: { walletId: number }) {
    return this.command<{
      walletId: number;
      recoverList: string[];
      numRequired: BigNumber | number;
    }>('did_get_recovery_list', args);
  }

  async recoverySpend(args: { walletId: number; attestFilenames: string[] }) {
    return this.command<{
      spendBundle: SpendBundle;
    }>('did_recovery_spend', args);
  }

  async createAttest(args: { walletId: number; filename: string; coinName: string; pubkey: string; puzhash: string }) {
    return this.command<{
      messageSpendBundle: string;
      info: (string | number | BigNumber)[];
      attestData: string;
    }>('did_create_attest', args);
  }

  async createBackupFile(args: { walletId: number; filename: string }) {
    return this.command<{
      walletId: number;
      backupData: string;
    }>('did_create_backup_file', args);
  }

  async getInformationNeededForRecovery(args: { walletId: number }) {
    return this.command<{
      walletId: number;
      myDid: string;
      coinName: string;
      newpuzhash: string;
      pubkey: string;
      backupDids: string[];
    }>('did_get_information_needed_for_recovery', args);
  }

  async getCurrentCoinInfo(args: { walletId: number }) {
    return this.command<{
      walletId: number;
      myDid: string;
      didParent: string;
      didInnerpuz: string;
      didAmount: BigNumber | number;
    }>('did_get_current_coin_info', args);
  }

  async getDIDInfo(args: { coinId: string; latest?: boolean }) {
    return this.command<
      | { success: false; error: string }
      | {
          success: true;
          didId: string;
          latestCoin: string;
          p2Address: string;
          publicKey: string;
          recoveryListHash: string;
          numVerification: number;
          metadata: Record<string, string>;
          launcherId: string;
          fullPuzzle: string;
          solution: any;
          hints: string[];
        }
    >('did_get_info', args);
  }

  async getDIDMetadata(args: { walletId: number }) {
    return this.command<{
      metadata: any;
    }>('did_get_metadata', args);
  }

  async updateDIDMetadata(args: {
    walletId: number;
    metadata: Record<string, string>;
    fee?: number;
    reusePuzhash?: boolean;
  }) {
    return this.command<
      | {
          success: true;
          walletId: number;
          spendBundle: SpendBundle;
          transactions: Transaction[];
          signingResponses?: string[];
        }
      | { success: false; error: string }
    >('did_update_metadata', args);
  }

  async findLostDID(args: {
    coinId: string;
    recoveryListHash?: string;
    numVerification?: number;
    metadata?: Record<string, any>;
  }) {
    return this.command<
      | {
          success: true;
          latestCoinId: number;
        }
      | { success: false; error: false }
    >('did_find_lost', args);
  }

  onDIDCoinAdded(callback: (data: any, message: Message) => void) {
    return this.onStateChanged('did_coin_added', callback);
  }
}
