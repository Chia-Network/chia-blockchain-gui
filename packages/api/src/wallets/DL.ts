import DataLayerRootHash from '../@types/DataLayerRootHash';
import Wallet from '../services/WalletService';

export default class DLWallet extends Wallet {
  async addMirror(args: { id: string; urls: string[]; amount: number; fee: number }) {
    return this.command<{}>('add_mirror', args);
  }

  async addMissingFiles(args: { ids: string[]; override: boolean; folderName: string }) {
    return this.command<{}>('add_missing_Files', args);
  }

  async batchUpdate(args: { id: string; changeList: string; fee: number }) {
    return this.command<{ txId: string }>('batch_update', args);
  }

  async cancelDataLayerOffer(args: { tradeId: string; fee: number }) {
    return this.command<{}>('cancel_offer', args);
  }

  async checkPlugins(args: {}) {
    return this.command<{ pluginStatus: any }>('check_plugins', args);
  }

  async clearPendingRoots(args: {}) {
    return this.command<{}>('clear_pending_roots', args);
  }

  async createDataStore(args: { storeId: string }) {
    return this.command<{ root: any }>('create_datastore', args);
  }

  async deleteDataLayerKey(args: {}) {
    return this.command<{}>('delete_key', args);
  }

  async deleteMirror(args: { id: string }) {
    return this.command<{ fee: number }>('delete_mirror', args);
  }

  async getAncestors(args: { id: string; hash: string }) {
    return this.command<{ ancestors: any[] }>('get_ancestors', args);
  }

  async getKeys(args: { id: string; rootHash: string }) {
    return this.command<{ keys: any }>('get_keys', args);
  }

  async getKeysValues(args: { id: string; rootHash: string }) {
    return this.command<{ keysValues: any }>('get_keys_values', args);
  }

  async getKvDiff(args: { id: string; hash1: string; hash2: string }) {
    return this.command<{ diff: any }>('get_kv_diff', args);
  }

  async getLocalRoot(args: { id: string }) {
    return this.command<{ hash: string }>('get_local_root', args);
  }

  async getMirrors(args: { id: string }) {
    return this.command<{ mirrors: any }>('get_mirrors', args);
  }

  async getOwnedStores(args: {}) {
    return this.command<{ storeIds: string[] }>('get_owned_stores', args);
  }

  async getRoot(args: { id: string }) {
    return this.command<{ confirmed: boolean; hash: string; timestamp: number }>('get_root', args);
  }

  async getRoots(args: {}) {
    return this.command<{ rootHashes: DataLayerRootHash[] }>('get_roots', args);
  }

  async getRootHistory(args: { id: string }) {
    return this.command<{ rootHistory: any[] }>('get_root_history', args);
  }

  async getDataLayerSyncStatus(args: { id: string }) {
    return this.command<{ syncStatus: any }>('get_sync_status', args);
  }

  async getValue(args: { id: string; key: string; rootHash: string }) {
    return this.command<{ value: string }>('get_value', args);
  }

  async insert(args: { id: string; key: string; value: string; fee: number }) {
    return this.command<{ txId: string }>('insert', args);
  }

  async makeDataLayerOffer(args: { maker: string; fee: number }) {
    return this.command<{ offer: any }>('make_offer', args);
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

  async takeDataLayerOffer(args: { offer: string; fee: number }) {
    return this.command<{ tradeId: string }>('take_offer', args);
  }

  async unsubscribe(args: { id: string }) {
    return this.command<{}>('unsubscribe', args);
  }

  async verifyOffer(args: { offer: string }) {
    return this.command<{ error: string; fee: number; success: boolean; valid: boolean }>('verify_offer', args);
  }
}
