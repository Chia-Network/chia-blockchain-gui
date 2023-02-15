import BigNumber from 'bignumber.js';

import type Connection from '../@types/Connection';
import type FarmedAmount from '../@types/FarmedAmount';
import type OfferSummaryRecord from '../@types/OfferSummaryRecord';
import type PoolWalletStatus from '../@types/PoolWalletStatus';
import type PrivateKey from '../@types/PrivateKey';
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

  async getWallets({ includeData = false }: { includeData: boolean }) {
    return this.command<{ fingerprint: number; wallets: WalletListItem[] }>('get_wallets', {
      includeData,
    });
  }

  async getTransaction(transactionId: string) {
    return this.command<{ transaction: Transaction; transactionId: string }>('get_transaction', {
      transactionId,
    });
  }

  async getTransactionMemo(transactionId: string) {
    return this.command('get_transaction_memo', {
      transactionId,
    });
  }

  async getPwStatus(walletId: number) {
    return this.command<{ state: PoolWalletStatus; unconfirmedTransactions: Transaction[] }>('pw_status', {
      walletId,
    });
  }

  async pwAbsorbRewards(walletId: number, fee?: string) {
    return this.command<{ state: PoolWalletStatus; transaction: Transaction }>('pw_absorb_rewards', {
      walletId,
      fee,
    });
  }

  async pwJoinPool(
    walletId: number,
    poolUrl: string,
    relativeLockHeight: number,
    targetPuzzlehash?: string,
    fee?: string
  ) {
    return this.command<{ totalFee: number; transaction: Transaction }>('pw_join_pool', {
      walletId,
      poolUrl,
      relativeLockHeight,
      targetPuzzlehash,
      fee,
    });
  }

  async pwSelfPool(walletId: number, fee?: string) {
    return this.command<{ totalFee: number; transaction: Transaction }>('pw_self_pool', {
      walletId,
      fee,
    });
  }

  async createNewWallet(walletType: 'pool_wallet' | 'rl_wallet' | 'did_wallet' | 'cat_wallet', options: Object = {}) {
    return this.command<WalletCreate>('create_new_wallet', {
      walletType,
      ...options,
    });
  }

  async deleteUnconfirmedTransactions(walletId: number) {
    return this.command<void>('delete_unconfirmed_transactions', {
      walletId,
    });
  }

  async getWalletBalance(walletId: number) {
    return this.command<{ walletBalance: WalletBalance }>('get_wallet_balance', {
      walletId,
    });
  }

  async getFarmedAmount() {
    return this.command<FarmedAmount>('get_farmed_amount');
  }

  async sendTransaction(walletId: number, amount: BigNumber, fee: BigNumber, address: string, memos?: string[]) {
    return this.command<{ transaction: Transaction; transactionId: string }>('send_transaction', {
      walletId,
      amount,
      fee,
      address,
      memos,
    });
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

  async addKey(mnemonic: string[], type: 'new_wallet' | 'skip' | 'restore_backup') {
    return this.command<{ fingerprint: number }>('add_key', {
      mnemonic,
      type,
    });
  }

  async deleteKey(fingerprint: number) {
    return this.command<void>('delete_key', {
      fingerprint,
    });
  }

  async checkDeleteKey(fingerprint: number) {
    return this.command<{
      fingerprint: number;
      usedForFarmerRewards: boolean;
      usedForPoolRewards: boolean;
      walletBalance: boolean;
    }>('check_delete_key', {
      fingerprint,
    });
  }

  async deleteAllKeys() {
    return this.command<void>('delete_all_keys');
  }

  async logIn(
    fingerprint: string,
    type: 'normal' | 'skip' | 'restore_backup' = 'normal' // skip is used to skip import
  ) {
    return this.command<{ fingerprint: number }>('log_in', {
      fingerprint,
      type,
    });
  }

  async getPrivateKey(fingerprint: number) {
    return this.command<{ privateKey: PrivateKey }>('get_private_key', {
      fingerprint,
    });
  }

  async getTransactions(
    walletId: number,
    start?: number,
    end?: number,
    sortKey?: 'CONFIRMED_AT_HEIGHT' | 'RELEVANCE',
    reverse?: boolean
  ) {
    return this.command<{ transactions: Transaction[]; walletId: number }>('get_transactions', {
      walletId,
      start,
      end,
      sortKey,
      reverse,
    });
  }

  async getTransactionsCount(walletId: number) {
    return this.command<{ count: number; walletId: number }>('get_transaction_count', {
      walletId,
    });
  }

  async getNextAddress(walletId: number, newAddress: boolean) {
    return this.command<{
      address: string;
      walletId: number;
    }>('get_next_address', {
      walletId,
      newAddress,
    });
  }

  async farmBlock(address: string) {
    return this.command<void>('farm_block', {
      address,
    });
  }

  async getTimestampForHeight(height: number) {
    return this.command<{
      timestamp: number;
    }>('get_timestamp_for_height', {
      height,
    });
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
    return this.command<{ connections: Connection }>('get_connections');
  }

  async getAllOffers(
    start?: number,
    end?: number,
    sortKey?: 'CONFIRMED_AT_HEIGHT' | 'RELEVANCE',
    reverse?: boolean,
    includeMyOffers?: boolean,
    includeTakenOffers?: boolean
  ) {
    return this.command<{ offers: string[]; tradeRecords: TradeRecord[] }>('get_all_offers', {
      includeCompleted: true,
      fileContents: true,
      start,
      end,
      sortKey,
      reverse,
      excludeMyOffers: !includeMyOffers,
      excludeTakenOffers: !includeTakenOffers,
    });
  }

  async getOffersCount() {
    return this.command<{ myOffersCount: number; takenOffersCount: number; total: number }>('get_offers_count');
  }

  async createOfferForIds(
    offer: { [key: string]: number },
    fee: number,
    driverDict: any,
    validateOnly?: boolean,
    disableJSONFormatting?: boolean
  ) {
    return this.command<{ offer: string; tradeRecord: TradeRecord }>(
      'create_offer_for_ids',
      {
        offer,
        fee,
        driver_dict: driverDict,
        validate_only: !!validateOnly,
      },
      false,
      undefined,
      disableJSONFormatting
    );
  }

  async cancelOffer(tradeId: string, secure: boolean, fee: number | string) {
    return this.command<void>('cancel_offer', {
      tradeId,
      secure,
      fee,
    });
  }

  async checkOfferValidity(offer: string) {
    return this.command<{ id: string; valid: boolean }>('check_offer_validity', {
      offer,
    });
  }

  async takeOffer(offer: string, fee: number | string) {
    return this.command<{ tradeRecord: TradeRecord }>('take_offer', {
      offer,
      fee,
    });
  }

  async getOfferSummary(offerData: string) {
    return this.command<{ id: string; summary: OfferSummaryRecord }>('get_offer_summary', {
      offer: offerData,
    });
  }

  // TODO refactor the getOfferData and getOfferRecord into get_offer, to match the backend
  async getOfferData(offerId: string) {
    return this.command<{ offer: string; tradeRecord: TradeRecord }>('get_offer', {
      tradeId: offerId,
      fileContents: true,
    });
  }

  async getOfferRecord(offerId: string) {
    return this.command<{ offer: null; tradeRecord: TradeRecord }>('get_offer', {
      tradeId: offerId,
      fileContents: false,
    });
  }

  async getCurrentDerivationIndex() {
    return this.command<{ index: number }>('get_current_derivation_index');
  }

  async extendDerivationIndex(index: number) {
    return this.command<{ index: number }>('extend_derivation_index', {
      index,
    });
  }

  async signMessageByAddress(address: string, message: string) {
    return this.command<{
      pubkey: string;
      signature: string;
    }>('sign_message_by_address', {
      address,
      message,
    });
  }

  async signMessageById(id: string, message: string) {
    return this.command<{
      pubkey: string;
      signature: string;
      latestCoinId: string;
    }>('sign_message_by_id', {
      id,
      message,
    });
  }

  // notifications
  async getNotifications(ids?: string[], start?: number, end?: number) {
    return this.command<{
      notifications: {
        id: string;
        message: string;
        amount: string;
      }[];
    }>('get_notifications', {
      ids,
      start,
      end,
    });
  }

  async deleteNotifications(ids?: string[]) {
    return this.command<void>('delete_notifications', {
      ids,
    });
  }

  async sendNotification(target: string, message: string, amount: string | number, fee: string | number) {
    return this.command<{
      tx: Transaction;
    }>('send_notification', {
      target,
      message,
      amount,
      fee,
    });
  }

  async verifySignature(
    message: string,
    pubkey: string,
    signature: string,
    address?: string,
    signingMode?: string
  ): Promise<{
    success: boolean;
    isValid: boolean;
    error: string;
  }> {
    return this.command('verify_signature', {
      message,
      pubkey,
      signature,
      address,
      signingMode,
    });
  }

  async resyncWallet() {
    return this.command('set_wallet_resync_on_startup');
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
        success: boolean;
        walletId: number;
      },
      message: Message
    ) => void
  ) {
    return this.onStateChanged('coin_added', callback);
  }

  onCoinRemoved(
    callback: (
      data: {
        additionalData: Object;
        state: 'coin_removed';
        success: boolean;
        walletId: number;
      },
      message: Message
    ) => void
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
        success: boolean;
        walletId: number;
      },
      message: Message
    ) => void
  ) {
    return this.onStateChanged('nft_coin_added', callback);
  }

  onNFTCoinRemoved(
    callback: (
      data: {
        additionalData: Object;
        state: 'nft_coin_removed';
        success: boolean;
        walletId: number;
      },
      message: Message
    ) => void
  ) {
    return this.onStateChanged('nft_coin_removed', callback);
  }

  onNFTCoinTransferred(
    callback: (
      data: {
        additionalData: Object;
        state: 'nft_coin_transferred';
        success: boolean;
        walletId: number;
      },
      message: Message
    ) => void
  ) {
    return this.onStateChanged('nft_coin_transferred', callback);
  }

  onNewDerivationIndex(
    callback: (
      data: {
        additionalData: {
          index: number;
        };
      },
      message: Message
    ) => void,
    processData?: (data: any) => any
  ) {
    return this.onStateChanged('new_derivation_index', callback, processData);
  }
}
