import { DataLayerChange } from '../@types/DataLayerChange';
import Client from '../Client';
import ServiceName from '../constants/ServiceName';

import Service from './Service';
import type { Options } from './Service';

export default class DataLayer extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.DATALAYER, client, options);
  }

  async addMirror(args: { id: string; urls: string[]; amount: number; fee?: number }) {
    return this.command<{}>('add_mirror', args);
  }

  async addMissingFiles(args: { ids?: string[]; override?: boolean; foldername?: string }) {
    return this.command<{}>('add_missing_files', args);
  }

  async batchUpdate(args: { id: string; changelist: DataLayerChange[]; fee?: number; submitOnChain?: boolean }) {
    return this.command<{ txId?: string }>('batch_update', args);
  }

  async cancelOffer(args: { tradeId: string; secure: boolean; fee?: number }) {
    return this.command<{ success: boolean }>('cancel_offer', args);
  }

  async checkPlugins(args: {}) {
    return this.command<{
      pluginStatus: {
        uploaders: Record<string, any>;
        downloaders: Record<string, any>;
      };
    }>('check_plugins', args);
  }

  async clearPendingRoots(args: { storeId: string }) {
    return this.command<{
      success: boolean;
      root:
        | {
            treeId: string;
            nodeHash: string | undefined;
            generation: number;
            status: number;
          }
        | undefined;
    }>('clear_pending_roots', args);
  }

  async createDataStore(args: { fee?: number; verbose?: boolean }) {
    return this.command<{ txs?: any[]; id: string }>('create_data_store', args);
  }

  async deleteKey(args: { id: string; key: string; fee?: number }) {
    return this.command<{ txId: string }>('delete_key', args);
  }

  async deleteMirror(args: { coinId: string; fee?: number }) {
    return this.command<{}>('delete_mirror', args);
  }

  async getAncestors(args: { id: string; hash: string }) {
    return this.command<{
      ancestors: Array<{
        hash: string;
        leftHash: string;
        rightHash: string;
      }>;
    }>('get_ancestors', args);
  }

  async getKeys(args: { id: string; rootHash?: string; page?: number; maxPageSize?: number }) {
    return this.command<
      | {
          keys: string[];
        }
      | {
          keys: string[];
          totalPages: number;
          totalBytes: number;
          rootHash: string | undefined;
        }
    >('get_keys', args);
  }

  async getKeysValues(args: { id: string; rootHash?: string; page?: number; maxPageSize?: number }) {
    return this.command<
      | {
          keysValues: Array<{
            hash: string;
            key: string;
            value: string;
          }>;
        }
      | {
          keysValues: Array<{
            hash: string;
            key: string;
            value: string;
          }>;
          totalPages: number;
          totalBytes: number;
          rootHash: string | undefined;
        }
    >('get_keys_values', args);
  }

  async getKvDiff(args: { id: string; hash1: string; hash2: string; page?: number; maxPageSize?: number }) {
    return this.command<
      | {
          diff: Array<{
            type: string;
            key: string;
            value: string;
          }>;
        }
      | {
          diff: Array<{
            type: string;
            key: string;
            value: string;
          }>;
          totalPages: number;
          totalBytes: number;
        }
    >('get_kv_diff', args);
  }

  async getLocalRoot(args: { id: string }) {
    return this.command<{ hash: string | undefined }>('get_local_root', args);
  }

  async getMirrors(args: { id: string }) {
    return this.command<{
      mirrors: Array<{
        coinId: string;
        launcherId: string;
        amount: number;
        urls: string[];
        ours: boolean;
      }>;
    }>('get_mirrors', args);
  }

  async getOwnedStores(args: {}) {
    return this.command<{ storeIds: string[]; success: boolean }>('get_owned_stores', args);
  }

  async getRoot(args: { id: string }) {
    return this.command<{
      hash: string;
      confirmed: boolean;
      timestamp: number;
    }>('get_root', args);
  }

  async getRoots(args: { ids: string[] }) {
    return this.command<{
      rootHashes: Array<{
        id: string;
        hash: string;
        confirmed: boolean;
        timestamp: number;
      }>;
    }>('get_roots', args);
  }

  async getRootHistory(args: { id: string }) {
    return this.command<{
      rootHistory: Array<{
        rootHash: string;
        confirmed: boolean;
        timestamp: number;
      }>;
    }>('get_root_history', args);
  }

  async getSyncStatus(args: { id: string }) {
    return this.command<{
      syncStatus: {
        rootHash: string;
        generation: number;
        targetRootHash: string;
        targetGeneration: number;
      };
    }>('get_sync_status', args);
  }

  async getValue(args: { id: string; key: string; rootHash?: string }) {
    return this.command<{
      value: string | undefined;
    }>('get_value', args);
  }

  async insert(args: { id: string; key: string; value: string; fee?: number }) {
    return this.command<{ txId: string }>('insert', args);
  }

  async makeOffer(args: {
    maker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
    taker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
    fee?: number;
  }) {
    return this.command<{
      success: boolean;
      offer: {
        tradeId: string;
        offer: string;
        taker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
        maker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
      };
    }>('make_offer', args);
  }

  async removeSubscriptions(args: { id: string; urls: string[] }) {
    return this.command<{}>('remove_subscriptions', args);
  }

  async subscribe(args: { id: string; urls: string[] }) {
    return this.command<{}>('subscribe', args);
  }

  async subscriptions(args: {}) {
    return this.command<{ storeIds: string[] }>('subscriptions', args);
  }

  async takeOffer(args: {
    offer: {
      tradeId: string;
      offer: string;
      taker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
      maker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
    };
    fee?: number;
  }) {
    return this.command<{ success: boolean; tradeId: string }>('take_offer', args);
  }

  async unsubscribe(args: { id: string; retain?: boolean }) {
    return this.command<{}>('unsubscribe', args);
  }

  async verifyOffer(args: {
    offer: {
      tradeId: string;
      offer: string;
      taker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
      maker: { storeId: string; inclusions: Array<{ key: string; value: string }> };
    };
    fee?: number;
  }) {
    return this.command<{
      success: boolean;
      valid: boolean;
      error: string | undefined;
      fee: number | undefined;
    }>('verify_offer', args);
  }

  async walletLogIn(args: { fingerprint: number }) {
    return this.command<{}>('wallet_log_in', args);
  }
}
