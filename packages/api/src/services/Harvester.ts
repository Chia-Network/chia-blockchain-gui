import Client from '../Client';
import type Message from '../Message';
import ServiceName from '../constants/ServiceName';
import Service from './Service';
import type { Options } from './Service';

export default class Harvester extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.HARVESTER, client, options);
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
}
