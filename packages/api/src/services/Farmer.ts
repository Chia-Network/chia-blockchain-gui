import type Connection from '../@types/Connection';
import Harvester, { type HarvesterSummary } from '../@types/Harvester';
import type HarvesterPlotsPaginated from '../@types/HarvesterPlotsPaginated';
import type NewFarmingInfo from '../@types/NewFarmingInfo';
import type PoolState from '../@types/PoolState';
import type ProofOfSpace from '../@types/ProofOfSpace';
import type RewardTargets from '../@types/RewardTargets';
import type SignagePoint from '../@types/SignagePoint';
import Client from '../Client';
import type Message from '../Message';
import ServiceName from '../constants/ServiceName';
import Service from './Service';
import type { Options } from './Service';

const FARMING_INFO_MAX_ITEMS = 1000;
export default class Farmer extends Service {
  // last FARMING_INFO_MAX_ITEMS farming info
  private newFarmingInfo: NewFarmingInfo[] = [];

  constructor(client: Client, options?: Options) {
    super(ServiceName.FARMER, client, options, async () => {
      this.onNewFarmingInfo((data) => {
        const { farmingInfo } = data;

        if (farmingInfo) {
          this.newFarmingInfo = [farmingInfo, ...this.newFarmingInfo].slice(0, FARMING_INFO_MAX_ITEMS);

          this.emit('farming_info_changed', this.newFarmingInfo, null);
        }
      });
    });
  }

  async getNewFarmingInfo() {
    await this.whenReady();
    return this.newFarmingInfo;
  }

  async getRewardTargets(args: { searchForPrivateKey: boolean }) {
    return this.command<RewardTargets>('get_reward_targets', args);
  }

  async setRewardTargets(args: { farmerTarget: string; poolTarget: string }) {
    return this.command<void>('set_reward_targets', args);
  }

  async getSignagePoints() {
    return this.command<{ signagePoints: SignagePoint[]; proofs: ProofOfSpace[] }>('get_signage_points');
  }

  async getConnections() {
    return this.command<{ connections: Connection[] }>('get_connections');
  }

  async openConnection(args: { host: string; port: string }) {
    return this.command<void>('open_connection', args);
  }

  async closeConnection(args: { nodeId: string }) {
    return this.command<void>('close_connection', args);
  }

  async getPoolState() {
    return this.command<{ poolState: PoolState[] }>('get_pool_state');
  }

  async setPayoutInstructions(args: { launcherId: string; payoutInstructions: string }) {
    return this.command<void>('set_payout_instructions', args);
  }

  async getHarvesters() {
    return this.command<{ harvesters: Harvester[] }>('get_harvesters');
  }

  async getHarvesterPlotsValid(args: { nodeId: string; page?: number; pageSize?: number }) {
    const { nodeId, page = 0, pageSize = 10 } = args;
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_valid', { nodeId, page, pageSize });
  }

  async getHarvesterPlotsInvalid(args: { nodeId: string; page?: number; pageSize?: number }) {
    const { nodeId, page = 0, pageSize = 10 } = args;
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_invalid', { nodeId, page, pageSize });
  }

  async getHarvesterPlotsKeysMissing(args: { nodeId: string; page?: number; pageSize?: number }) {
    const { nodeId, page = 0, pageSize = 10 } = args;
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_keys_missing', { nodeId, page, pageSize });
  }

  async getHarvesterPlotsDuplicates(args: { nodeId: string; page?: number; pageSize?: number }) {
    const { nodeId, page = 0, pageSize = 10 } = args;
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_duplicates', { nodeId, page, pageSize });
  }

  async getHarvestersSummary() {
    return this.command<{ harvesters: HarvesterSummary[] }>('get_harvesters_summary');
  }

  async getPoolLoginLink(args: { launcherId: string }) {
    return this.command<{ loginLink: string }>('get_pool_login_link', args);
  }

  onConnections(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('get_connections', callback, processData);
  }

  onNewFarmingInfo(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('new_farming_info', callback, processData);
  }

  onNewPlots(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('new_plots', callback, processData);
  }

  onNewSignagePoint(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('new_signage_point', callback, processData);
  }

  onHarvesterChanged(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('get_harvesters', callback, processData);
  }

  onHarvesterUpdated(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('harvester_update', callback, processData);
  }

  onHarvesterRemoved(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('harvester_removed', callback, processData);
  }

  onRefreshPlots(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('refresh_plots', callback, processData);
  }

  onFarmingInfoChanged(callback: (data: any, message?: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('farming_info_changed', callback, processData);
  }
}
