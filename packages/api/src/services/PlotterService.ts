import PlotQueueItem from '../@types/PlotQueueItem';
import Client from '../Client';
import type Message from '../Message';
import ServiceName from '../constants/ServiceName';

import Service from './Service';
import type { Options } from './Service';

function parseProgressUpdate(line: string, currentProgress: number): number {
  let progress: number = currentProgress;
  if (line.startsWith('Progress update: ')) {
    progress = Math.min(1, parseFloat(line.substr('Progress update: '.length)));
  }
  return progress;
}

function addPlotProgress(queue: PlotQueueItem[]): PlotQueueItem[] {
  if (!queue) {
    return queue;
  }

  return queue.map((item) => {
    const { log, state } = item;
    if (state === 'FINISHED') {
      return {
        ...item,
        progress: 1.0,
      };
    }
    if (state !== 'RUNNING') {
      return item;
    }

    let progress = item.progress || 0;

    if (log) {
      const lines = log.trim().split(/\r\n|\r|\n/);
      const lastLine = lines[lines.length - 1];

      progress = parseProgressUpdate(lastLine, progress);
    }

    return {
      ...item,
      progress,
    };
  });
}

function mergeQueue(
  // partialQueue does not contain `log` property. currentQueue and the result contains it
  currentQueue: PlotQueueItem[],
  partialQueue: PlotQueueItem[],
  isLogChange: boolean
): PlotQueueItem[] {
  let result = [...currentQueue];

  partialQueue.forEach((item) => {
    const { id, log, logNew, ...rest } = item;

    const index = currentQueue.findIndex((queueItem) => queueItem.id === id);
    if (index === -1) {
      result = [...currentQueue, item];
      return;
    }

    const originalItem = currentQueue[index];

    const newItem = {
      ...originalItem,
      ...rest,
    };

    if (isLogChange && logNew !== undefined) {
      const newLog = originalItem.log ? `${originalItem.log}${logNew}` : logNew;

      newItem.log = newLog;
    }

    result = Object.assign([...result], { [index]: newItem });
  });

  return addPlotProgress(result);
}

export default class Plotter extends Service {
  private queue: PlotQueueItem[] | undefined;

  constructor(client: Client, options?: Options) {
    super(ServiceName.PLOTTER, client, options, async () => {
      this.onLogChanged((data: any) => {
        const { queue } = data;
        this.queue = mergeQueue(this.queue || [], queue, true);
        this.emit('queue_changed', this.queue, null);
      });

      this.onPlotQueueStateChange((data: any) => {
        const { queue } = data;
        this.queue = mergeQueue(this.queue || [], queue, false);
        this.emit('queue_changed', this.queue, null);
      });

      const { queue } = await this.register();
      if (queue) {
        this.queue = queue;
      }
    });
  }

  async getQueue() {
    await this.whenReady();
    return this.queue;
  }

  onQueueChanged(callback: (data: any, message?: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('queue_changed', callback, processData);
  }

  onLogChanged(callback: (data: any, message?: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('log_changed', callback, processData);
  }

  onPlotQueueStateChange(callback: (data: any, message?: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('state_changed', callback, processData);
  }
}
