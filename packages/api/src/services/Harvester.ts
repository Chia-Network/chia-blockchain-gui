import type FarmingInfo from '../@types/FarmingInfo';
import Client from '../Client';
import type Message from '../Message';
import ServiceName from '../constants/ServiceName';
import Service from './Service';
import type { Options } from './Service';

const FARMING_INFO_MAX_ITEMS = 1000;
export type FarmingInfoWithIndex = FarmingInfo & { index: number };

export default class Harvester extends Service {
  private farmingInfo: FarmingInfoWithIndex[] = [];

  private farmingInfoIndex = 0;

  constructor(client: Client, options?: Options) {
    super(ServiceName.HARVESTER, client, options, async () => {
      this.onFarmingInfo((data) => {
        const dataWithIndex: FarmingInfoWithIndex = {
          ...data,
          index: this.farmingInfoIndex++,
        };
        this.farmingInfo = [dataWithIndex, ...this.farmingInfo].slice(0, FARMING_INFO_MAX_ITEMS);
        this.emit('farming_info_changed', this.farmingInfo, null);
      });
    });
  }

  async getFarmingInfo() {
    await this.whenReady();
    return this.farmingInfo;
  }

  async refreshPlots() {
    return this.command<void>('refresh_plots');
  }

  async getPlotDirectories() {
    return this.command<{ directories: string[] }>('get_plot_directories');
  }

  async deletePlot(args: { filename: string }) {
    return this.command<void>('delete_plot', args);
  }

  async addPlotDirectory(args: { dirname: string }) {
    return this.command<void>('add_plot_directory', args);
  }

  async removePlotDirectory(args: { dirname: string }) {
    return this.command<void>('remove_plot_directory', args);
  }

  onRefreshPlots(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('refresh_plots', callback, processData);
  }

  onFarmingInfo(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('farming_info', callback, processData);
  }

  onFarmingInfoChanged(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('farming_info_changed', callback, processData);
  }
}
