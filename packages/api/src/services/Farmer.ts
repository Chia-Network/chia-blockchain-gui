import type Connection from '../@types/Connection';
import type FarmingInfo from '../@types/FarmingInfo';
import Harvester, { type HarvesterSummary } from '../@types/Harvester';
import type HarvesterPlotsPaginated from '../@types/HarvesterPlotsPaginated';
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
  private farmingInfo: FarmingInfo[] = [];

  constructor(client: Client, options?: Options) {
    super(ServiceName.FARMER, client, options, async () => {
      this.onNewFarmingInfo((data) => {
        const { farmingInfo } = data;

        if (farmingInfo) {
          this.farmingInfo = [farmingInfo, ...this.farmingInfo].slice(0, FARMING_INFO_MAX_ITEMS);

          this.emit('farming_info_changed', this.farmingInfo, null);
        }
      });
    });
  }

  async getFarmingInfo() {
    await this.whenReady();
    return this.farmingInfo;
  }

  async getRewardTargets(searchForPrivateKey: boolean) {
    return this.command<RewardTargets>('get_reward_targets', {
      searchForPrivateKey,
    });
  }

  async setRewardTargets(farmerTarget: string, poolTarget: string) {
    return this.command<void>('set_reward_targets', {
      farmerTarget,
      poolTarget,
    });
  }

  async getSignagePoints() {
    return this.command<{ signagePoints: SignagePoint[]; proofs: ProofOfSpace[] }>('get_signage_points');
  }

  async getConnections() {
    return this.command<{ connections: Connection[] }>('get_connections');
  }

  async openConnection(host: string, port: string) {
    return this.command<void>('open_connection', {
      host,
      port,
    });
  }

  async closeConnection(nodeId: string) {
    return this.command<void>('close_connection', {
      nodeId,
    });
  }

  async getPoolState() {
    return this.command<{ poolState: PoolState[] }>('get_pool_state');
  }

  async setPayoutInstructions(launcherId: string, payoutInstructions: string) {
    return this.command<void>('set_payout_instructions', {
      launcherId,
      payoutInstructions,
    });
  }

  async getHarvesters() {
    return this.command<{ harvesters: Harvester[] }>('get_harvesters');
  }

  async getHarvesterPlotsValid(nodeId: string, page = 0, pageSize = 10) {
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_valid', {
      nodeId,
      page,
      pageSize,
    });
  }

  async getHarvesterPlotsInvalid(nodeId: string, page = 0, pageSize = 10) {
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_invalid', {
      nodeId,
      page,
      pageSize,
    });
  }

  async getHarvesterPlotsKeysMissing(nodeId: string, page = 0, pageSize = 10) {
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_keys_missing', {
      nodeId,
      page,
      pageSize,
    });
  }

  async getHarvesterPlotsDuplicates(nodeId: string, page = 0, pageSize = 10) {
    return this.command<HarvesterPlotsPaginated>('get_harvester_plots_duplicates', {
      nodeId,
      page,
      pageSize,
    });
  }

  async getHarvestersSummary() {
    return this.command<HarvesterSummary>('get_harvesters_summary');
  }

  async getPoolLoginLink(launcherId: string) {
    return this.command<{ loginLink: string }>('get_pool_login_link', {
      launcherId,
    });
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
