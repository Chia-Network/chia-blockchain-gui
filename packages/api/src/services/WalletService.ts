import BigNumber from 'bignumber.js';

import type AutoClaim from '../@types/AutoClaim';
import type Connection from '../@types/Connection';
import type FarmedAmount from '../@types/FarmedAmount';
import type OfferSummaryRecord from '../@types/OfferSummaryRecord';
import type PoolWalletStatus from '../@types/PoolWalletStatus';
import type PrivateKey from '../@types/PrivateKey';
import type PuzzleDecorator from '../@types/PuzzleDecorator';
import type TradeRecord from '../@types/TradeRecord';
import type Transaction from '../@types/Transaction';
import type { WalletListItem } from '../@types/Wallet';
import type WalletBalance from '../@types/WalletBalance';
import type WalletCreate from '../@types/WalletCreate';
import Client from '../Client';
import type Message from '../Message';
import ServiceName from '../constants/ServiceName';

import Service from './Service';
import type { Options } from './Service';

export default class Wallet extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.WALLET, client, options);
  }

  async getLoggedInFingerprint() {
    return this.command<{ fingerprint: number }>('get_logged_in_fingerprint');
  }

  async getWallets(args?: { includeData: boolean }) {
    const { includeData = false } = args || {};
    return this.command<{ fingerprint: number; wallets: WalletListItem[] }>('get_wallets', {
      includeData,
    });
  }

  async getTransaction(args: { transactionId: string }) {
    return this.command<{ transaction: Transaction; transactionId: string }>('get_transaction', args);
  }

  async getTransactionMemo(args: { transactionId: string }) {
    return this.command<{
      [transactionId: string]: {
        [coinId: string]: string[];
      };
    }>('get_transaction_memo', args);
  }

  async getPwStatus(args: { walletId: number }) {
    return this.command<{ state: PoolWalletStatus; unconfirmedTransactions: Transaction[] }>('pw_status', args);
  }

  async pwAbsorbRewards(args: { walletId: number; fee?: string }) {
    return this.command<{ state: PoolWalletStatus; transaction: Transaction }>('pw_absorb_rewards', args);
  }

  async pwJoinPool(args: {
    walletId: number;
    poolUrl: string;
    relativeLockHeight: number;
    targetPuzzlehash?: string;
    fee?: string;
  }) {
    return this.command<{ totalFee: number; transaction: Transaction }>('pw_join_pool', args);
  }

  async pwSelfPool(args: { walletId: number; fee?: string }) {
    return this.command<{ totalFee: number; transaction: Transaction }>('pw_self_pool', args);
  }

  async createNewWallet(args: {
    walletType: 'pool_wallet' | 'rl_wallet' | 'did_wallet' | 'cat_wallet';
    options: Object;
  }) {
    return this.command<WalletCreate>('create_new_wallet', {
      walletType: args.walletType,
      ...args.options,
    });
  }

  async deleteUnconfirmedTransactions(args: { walletId: number }) {
    return this.command<void>('delete_unconfirmed_transactions', args);
  }

  async getWalletBalance(args: { walletId: number }) {
    return this.command<{ walletBalance: WalletBalance }>('get_wallet_balance', args);
  }

  async getWalletBalances(args?: { walletIds: number[] }) {
    return this.command<{ walletBalances: WalletBalance[] }>('get_wallet_balances', args);
  }

  async getFarmedAmount() {
    return this.command<FarmedAmount>('get_farmed_amount');
  }

  async sendTransaction(args: {
    walletId: number;
    amount: BigNumber;
    fee: BigNumber;
    address: string;
    memos?: string[];
    puzzleDecorator?: PuzzleDecorator[];
  }) {
    return this.command<{ transaction: Transaction; transactionId: string }>('send_transaction', args);
  }

  async generateMnemonic() {
    return this.command<{
      mnemonic: string[];
    }>('generate_mnemonic');
  }

  async getPublicKeys() {
    return this.command<{
      publicKeyFingerprints: number[];
    }>('get_public_keys');
  }

  async addKey(args: { mnemonic: string[]; type: 'new_wallet' | 'skip' | 'restore_backup' }) {
    return this.command<{ fingerprint: number }>('add_key', args);
  }

  async deleteKey(args: { fingerprint: number }) {
    return this.command<void>('delete_key', args);
  }

  async checkDeleteKey(args: { fingerprint: number }) {
    return this.command<{
      fingerprint: number;
      usedForFarmerRewards: boolean;
      usedForPoolRewards: boolean;
      walletBalance: boolean;
    }>('check_delete_key', args);
  }

  async deleteAllKeys() {
    return this.command<void>('delete_all_keys');
  }

  async logIn(args: {
    fingerprint: number;
    type?: 'normal' | 'skip' | 'restore_backup'; // skip is used to skip import
  }) {
    const { fingerprint, type = 'normal' } = args;
    return this.command<{ fingerprint: number }>('log_in', { fingerprint, type });
  }

  async getPrivateKey(args: { fingerprint: number }) {
    return this.command<{ privateKey: PrivateKey }>('get_private_key', args);
  }

  async getTransactions(args: {
    walletId: number;
    start?: number;
    end?: number;
    sortKey?: 'CONFIRMED_AT_HEIGHT' | 'RELEVANCE';
    typeFilter?: {
      mode: number;
      values: number[];
    };
    reverse?: boolean;
    confirmed?: boolean;
  }) {
    return this.command<{ transactions: Transaction[]; walletId: number }>('get_transactions', args);
  }

  async getTransactionsCount(args: {
    walletId: number;
    typeFilter?: {
      mode: number;
      values: number[];
    };
    confirmed?: boolean;
  }) {
    return this.command<{ count: number; walletId: number }>('get_transaction_count', args);
  }

  async getNextAddress(args: { walletId: number; newAddress: boolean }) {
    return this.command<{
      address: string;
      walletId: number;
    }>('get_next_address', args);
  }

  async farmBlock(args: { address: string }) {
    return this.command<void>('farm_block', args);
  }

  async getTimestampForHeight(args: { height: number }) {
    return this.command<{
      timestamp: number;
    }>('get_timestamp_for_height', args);
  }

  async getHeightInfo() {
    return this.command<{ height: number }>('get_height_info');
  }

  async getNetworkInfo() {
    return this.command<{ networkName: string; networkPrefix: string }>('get_network_info');
  }

  async getSyncStatus() {
    return this.command<{
      genesisInitialized: boolean;
      synced: boolean;
      syncing: boolean;
    }>('get_sync_status');
  }

  async getConnections() {
    return this.command<{ connections: Connection[] }>('get_connections');
  }

  async getAllOffers(args: {
    start?: number;
    end?: number;
    sortKey?: 'CONFIRMED_AT_HEIGHT' | 'RELEVANCE';
    reverse?: boolean;
    includeMyOffers?: boolean;
    includeTakenOffers?: boolean;
  }) {
    return this.command<{ offers: string[]; tradeRecords: TradeRecord[] }>('get_all_offers', {
      includeCompleted: true,
      fileContents: true,
      start: args.start,
      end: args.end,
      sortKey: args.sortKey,
      reverse: args.reverse,
      excludeMyOffers: !args.includeMyOffers,
      excludeTakenOffers: !args.includeTakenOffers,
    });
  }

  async getOffersCount() {
    return this.command<{ myOffersCount: number; takenOffersCount: number; total: number }>('get_offers_count');
  }

  async createOfferForIds(args: {
    offer: { [key: string]: number | BigNumber };
    fee: number | BigNumber;
    driverDict: any;
    validateOnly?: boolean;
    disableJSONFormatting?: boolean;
    maxTime?: number;
  }) {
    const { disableJSONFormatting, driverDict, ...restArgs } = args;
    return this.command<{ offer: string; tradeRecord: TradeRecord }>(
      'create_offer_for_ids',
      { driver_dict: driverDict, ...restArgs },
      false,
      undefined,
      disableJSONFormatting,
    );
  }

  async cancelOffer(args: { tradeId: string; secure: boolean; fee: number | string }) {
    return this.command<void>('cancel_offer', args);
  }

  async checkOfferValidity(args: { offer: string }) {
    return this.command<{ id: string; valid: boolean }>('check_offer_validity', args);
  }

  async takeOffer(args: { offer: string; fee: number | string }) {
    return this.command<{ tradeRecord: TradeRecord }>('take_offer', args);
  }

  async getOfferSummary({ offerData }: { offerData: string }) {
    return this.command<{ id: string; summary: OfferSummaryRecord }>('get_offer_summary', {
      offer: offerData,
    });
  }

  // TODO refactor the getOfferData and getOfferRecord into get_offer, to match the backend
  async getOfferData({ offerId }: { offerId: string }) {
    return this.command<{ offer: string; tradeRecord: TradeRecord }>('get_offer', {
      tradeId: offerId,
      fileContents: true,
    });
  }

  async getOfferRecord({ offerId }: { offerId: string }) {
    return this.command<{ offer: null; tradeRecord: TradeRecord }>('get_offer', {
      tradeId: offerId,
      fileContents: false,
    });
  }

  async getCurrentDerivationIndex() {
    return this.command<{ index: number }>('get_current_derivation_index');
  }

  async extendDerivationIndex(args: { index: number }) {
    return this.command<{ index: number }>('extend_derivation_index', args);
  }

  async signMessageByAddress(args: { address: string; message: string }) {
    return this.command<{
      pubkey: string;
      signature: string;
      isHex: boolean;
      safeMode: boolean;
    }>('sign_message_by_address', args);
  }

  async signMessageById(args: { id: string; message: string }) {
    return this.command<{
      pubkey: string;
      signature: string;
      latestCoinId: string;
    }>('sign_message_by_id', args);
  }

  // notifications
  async getNotifications(args: { ids?: string[]; start?: number; end?: number }) {
    return this.command<{
      notifications: {
        id: string;
        message: string;
        amount: string;
        height: number;
      }[];
    }>('get_notifications', args);
  }

  async deleteNotifications(args: { ids?: string[] }) {
    return this.command<void>('delete_notifications', args);
  }

  async sendNotification(args: { target: string; message: string; amount: string | number; fee: string | number }) {
    return this.command<{
      tx: Transaction;
    }>('send_notification', args);
  }

  async verifySignature(args: {
    message: string;
    pubkey: string;
    signature: string;
    address?: string;
    signingMode?: string;
  }) {
    return this.command<{ isValid: boolean }>('verify_signature', args);
  }

  async resyncWallet() {
    return this.command<void>('set_wallet_resync_on_startup');
  }

  // Clawback
  async setAutoClaim(args: AutoClaim) {
    return this.command<AutoClaim>('set_auto_claim', args);
  }

  async getAutoClaim() {
    return this.command<AutoClaim>('get_auto_claim');
  }

  async spendClawbackCoins(args: { coinIds: string[]; fee: number | BigNumber }) {
    return this.command<{
      transactionIds: string[];
    }>('spend_clawback_coins', args);
  }

  onSyncChanged(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('sync_changed', callback, processData);
  }

  onNewBlock(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('new_block', callback, processData);
  }

  onNewPeak(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('new_peak', callback, processData);
  }

  onCoinAdded(
    callback: (
      data: {
        additionalData: Object;
        state: 'coin_added';
        walletId: number;
      },
      message: Message,
    ) => void,
  ) {
    return this.onStateChanged('coin_added', callback);
  }

  onCoinRemoved(
    callback: (
      data: {
        additionalData: Object;
        state: 'coin_removed';
        walletId: number;
      },
      message: Message,
    ) => void,
  ) {
    return this.onStateChanged('coin_removed', callback);
  }

  onWalletCreated(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('wallet_created', callback, processData);
  }

  onConnections(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('get_connections', callback, processData);
  }

  onTransactionUpdate(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('tx_update', callback, processData);
  }

  onPendingTransaction(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('pending_transaction', callback, processData);
  }

  onOfferAdded(callback: (data: any, message: Message) => void) {
    return this.onStateChanged('offer_added', callback);
  }

  onOfferUpdated(callback: (data: any, message: Message) => void) {
    return this.onStateChanged('offer_cancelled', callback);
  }

  onNewOnChainNotification(callback: (data: any, message: Message) => void) {
    return this.onStateChanged('new_on_chain_notification', callback);
  }

  onNFTCoinAdded(
    callback: (
      data: {
        additionalData: Object;
        state: 'nft_coin_added';
        walletId: number;
      },
      message: Message,
    ) => void,
  ) {
    return this.onStateChanged('nft_coin_added', callback);
  }

  onNFTCoinRemoved(
    callback: (
      data: {
        additionalData: Object;
        state: 'nft_coin_removed';
        walletId: number;
      },
      message: Message,
    ) => void,
  ) {
    return this.onStateChanged('nft_coin_removed', callback);
  }

  onNFTCoinUpdated(
    callback: (
      data: {
        additionalData: Object;
        state: 'nft_coin_updated';
        walletId: number;
      },
      message: Message,
    ) => void,
  ) {
    return this.onStateChanged('nft_coin_updated', callback);
  }

  onVCCoinAdded(
    callback: (
      data: {
        additionalData: Object;
        state: 'vc_coin_added';
        walletId: number;
      },
      message: Message,
    ) => void,
  ) {
    return this.onStateChanged('vc_coin_added', callback);
  }

  onVCCoinRemoved(
    callback: (
      data: {
        additionalData: Object;
        state: 'vc_coin_removed';
        walletId: number;
      },
      message: Message,
    ) => void,
  ) {
    return this.onStateChanged('vc_coin_removed', callback);
  }

  onNewDerivationIndex(
    callback: (
      data: {
        additionalData: {
          index: number;
        };
      },
      message: Message,
    ) => void,
    processData?: (data: any) => any,
  ) {
    return this.onStateChanged('new_derivation_index', callback, processData);
  }

  onNFTCoinDIDSet(
    callback: (
      data: {
        additionalData: {
          index: number;
        };
      },
      message: Message,
    ) => void,
    processData?: (data: any) => any,
  ) {
    return this.onStateChanged('nft_coin_did_set', callback, processData);
  }
}
