import { DataLayerChange } from '../@types/DataLayerChange';
import Client from '../Client';
import ServiceName from '../constants/ServiceName';

import Service from './Service';
import type { Options } from './Service';

export default class DataLayer extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.DATALAYER, client, options);
  }

  async addMirror(args: { id: string; urls: string[]; amount: number; fee: number }) {
    return this.command<{}>('add_mirror', args);
  }

  async addMissingFiles(args: { ids: string[]; override: boolean; folderName: string }) {
    return this.command<{}>('add_missing_files', args);
  }

  async batchUpdate(args: { id: string; changeList: DataLayerChange[]; fee: number }) {
    return this.command<{}>('batch_update', args);
  }

  async cancelOffer(args: { tradeId: string; secure: boolean; fee: number }) {
    return this.command<{}>('cancel_offer', args);
  }

  async checkPlugins(args: {}) {
    return this.command<{}>('check_plugins', args);
  }

  async clearPendingRoots(args: { storeId: string }) {
    return this.command<{}>('clear_pending_roots', args);
  }

  async createDataStore(args: { fee: number }) {
    return this.command<{}>('create_data_store', args);
  }

  async deleteKey(args: { id: string; key: string; fee: number }) {
    return this.command<{}>('delete_key', args);
  }

  async deleteMirror(args: { id: string; fee: number }) {
    return this.command<{}>('delete_mirror', args);
  }

  async getAncestors(args: { id: string; hash: string }) {
    return this.command<{}>('get_ancestors', args);
  }

  async getKeys(args: { id: string; rootHash: string }) {
    return this.command<{}>('get_keys', args);
  }

  async getKeysValues(args: { id: string; rootHash: string }) {
    return this.command<{}>('get_keys_values', args);
  }

  async getKvDiff(args: { id: string; hash1: string; hash2: string }) {
    return this.command<{}>('get_kv_diff', args);
  }

  async getLocalRoot(args: { id: string }) {
    return this.command<{}>('get_local_root', args);
  }

  async getMirrors(args: { id: string }) {
    return this.command<{}>('get_mirrors', args);
  }

  async getOwnedStores(args: {}) {
    return this.command<{ storeIds: string[]; success: boolean }>('get_owned_stores', args);
  }

  async getRoot(args: { id: string }) {
    return this.command<{}>('get_root', args);
  }

  async getRoots(args: { ids: string[] }) {
    return this.command<{}>('get_roots', args);
  }

  async getRootHistory(args: { id: string }) {
    return this.command<{}>('get_root_history', args);
  }

  async getSyncStatus(args: { id: string }) {
    return this.command<{}>('get_sync_status', args);
  }

  async getValue(args: { id: string; key: string; rootHash: string }) {
    return this.command<{}>('get_value', args);
  }

  async insert(args: { id: string; key: string; value: string; fee: number }) {
    return this.command<{}>('insert', args);
  }

  async makeOffer(args: { maker: string; fee: number }) {
    return this.command<{}>('make_offer', args);
  }

  async removeSubscriptions(args: { id: string; urls: string[] }) {
    return this.command<{}>('remove_subscriptions', args);
  }

  async subscribe(args: { id: string; urls: string[] }) {
    return this.command<{}>('subscribe', args);
  }

  async subscriptions(args: {}) {
    return this.command<{}>('subscriptions', args);
  }

  async takeOffer(args: { offer: string; fee: number }) {
    return this.command<{}>('take_offer', args);
  }

  async unsubscribe(args: { id: string }) {
    return this.command<{}>('unsubscribe', args);
  }

  async verifyOffer(args: { offer: string }) {
    return this.command<{}>('verify_offer', args);
  }

  async walletLogIn(args: { fingerprint: string }) {
    return this.command<{}>('wallet_log_in', args);
  }
}
