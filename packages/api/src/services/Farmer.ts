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

// To reduce unnecessary data, utilize array for storing latency data
export type LatencyRecord = [number, number]; // [timestamp, latency]
export type LatencyInfo = {
  latency: LatencyRecord[];
  avg: number;
  min: number;
  max: number;
  latest: number;
  totalPlots: number;
};
export type LatencyData = {
  [nodeId: string]: LatencyInfo;
};
export type MissingSignagePointsRecord = [number, number]; // [timestamp, count of missing sps]

export default class Farmer extends Service {
  // last FARMING_INFO_MAX_ITEMS farming info
  private newFarmingInfo: NewFarmingInfo[] = [];

  private latencyData: LatencyData = {};

  private missingSps: MissingSignagePointsRecord[] = [];

  private totalMissingSps: number = 0;

  private totalPlotFilterChallenge: number = 0;

  private totalPlotsPassingFilter: number = 0;

  constructor(client: Client, options?: Options) {
    super(ServiceName.FARMER, client, options, async () => {
      this.onNewFarmingInfo((data: { farmingInfo: NewFarmingInfo }) => {
        const { farmingInfo } = data;

        if (farmingInfo) {
          this.totalPlotFilterChallenge += farmingInfo.totalPlots;
          this.totalPlotsPassingFilter += farmingInfo.passedFilter;

          this.newFarmingInfo = [farmingInfo, ...this.newFarmingInfo].slice(0, FARMING_INFO_MAX_ITEMS);

          // The Unit of Python's timestamp is seconds so converting it to milliseconds
          // to make it easy to compare with js timestamps
          const jsTimestamp = farmingInfo.timestamp * 1000;
          const latencyRecords: LatencyRecord[] = [
            ...(this.latencyData[farmingInfo.nodeId] ? this.latencyData[farmingInfo.nodeId].latency : []),
            [jsTimestamp, farmingInfo.lookupTime],
          ];

          const now = Date.now() / 1000; // Convert to seconds from milliseconds
          let deleteStartIndex = -1;
          let deleteCount = -1;
          let latencySum = 0;
          let latencyMax = 0;
          let latencyMin = 0;
          for (let i = 0; i < latencyRecords.length; i++) {
            const d = latencyRecords[i];
            const [timestamp, latency] = d;

            // Retire records older than or equal to 24 hours
            if (now - timestamp >= 86_400) {
              if (deleteStartIndex === -1) {
                deleteStartIndex = i;
                deleteCount = 1;
              } else {
                deleteCount++;
              }
            } else {
              latencySum += latency;
              latencyMax = Math.max(latencyMax, latency);
              latencyMin = Math.min(latencyMin, latency);
            }
          }
          if (deleteStartIndex > -1 && deleteCount > -1) {
            latencyRecords.splice(deleteStartIndex, deleteCount);
          }

          const latencyInfo: LatencyInfo = {
            latency: latencyRecords,
            avg: latencySum / latencyRecords.length,
            max: latencyMax,
            min: latencyMin,
            latest: farmingInfo.lookupTime,
            totalPlots: farmingInfo.totalPlots,
          };

          this.latencyData = {
            ...this.latencyData,
            [farmingInfo.nodeId]: latencyInfo,
          };

          this.emit(
            'farming_info_changed',
            {
              newFarmingInfo: this.newFarmingInfo,
              latencyData: this.latencyData,
            },
            null
          );
        }
      });

      this.onNewSignagePoint((data: { missingSignagePoints: MissingSignagePointsRecord }) => {
        if (!data.missingSignagePoints) {
          return;
        }
        const missingSps = [data.missingSignagePoints, ...this.missingSps];
        const now = Date.now() / 1000; // Convert to seconds from milliseconds

        let deletingIndex = -1;
        for (let i = missingSps.length - 1; i >= 0; i--) {
          const [timestamp] = missingSps[i];
          if (now - timestamp <= 86_400) {
            break;
          } else {
            deletingIndex = i;
          }
        }

        this.totalMissingSps += +data.missingSignagePoints[1];

        if (deletingIndex > -1) {
          // Remove array items expired.
          missingSps.splice(deletingIndex, this.missingSps.length - deletingIndex);
        }

        this.missingSps = missingSps;
      });
    });
  }

  async getNewFarmingInfo() {
    await this.whenReady();
    return {
      newFarmingInfo: this.newFarmingInfo,
      latencyData: this.latencyData,
    };
  }

  async getMissingSignagePoints() {
    await this.whenReady();
    return {
      missingSignagePoints: this.missingSps,
      totalMissingSps: this.totalMissingSps,
    };
  }

  getFilterChallengeStat(height: number) {
    const n = this.totalPlotFilterChallenge;
    const x = this.totalPlotsPassingFilter;
    let fb = 9; // Filter bits
    if (height < 5_496_000) {
      fb = 9;
    } else if (height < 10_542_000) {
      fb = 8;
    } else if (height < 15_592_000) {
      fb = 7;
    } else if (height < 20_643_000) {
      fb = 6;
    } else {
      fb = 5;
    }
    return {
      n,
      x,
      fb,
    };
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

  onSubmittedPartial(callback: (data: any, message?: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('submitted_partial', callback, processData);
  }

  onFailedPartial(callback: (data: any, message?: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('failed_partial', callback, processData);
  }
}
