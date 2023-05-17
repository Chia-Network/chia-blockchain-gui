import PlotterName from './PlotterName';

type PlotSize = {
  label: string;
  value: number;
  workspace: string;
  defaultRam: number;
};

export function getPlotSize(kSize: 25 | 32 | 33 | 34 | 35) {
  return (
    {
      25: '600MiB',
      32: '101.4GiB',
      33: '208.8GiB',
      34: '429.8GiB',
      35: '884.1GiB',
    }[kSize] || 'Size Unknown'
  );
}

export const plottingInfo: Record<PlotterName, PlotSize[]> = {
  [PlotterName.CHIAPOS]: [
    { value: 25, label: getPlotSize(25), workspace: '1.8GiB', defaultRam: 512 },
    { value: 32, label: getPlotSize(32), workspace: '239GiB', defaultRam: 3390 },
    { value: 33, label: getPlotSize(33), workspace: '521GiB', defaultRam: 7400 },
    // workspace are guesses using 55.35% - rounded up - past here
    { value: 34, label: getPlotSize(34), workspace: '1041GiB', defaultRam: 14_800 },
    { value: 35, label: getPlotSize(35), workspace: '2175GiB', defaultRam: 29_600 },
  ],
  [PlotterName.MADMAX]: [
    { value: 25, label: getPlotSize(25), workspace: '1.8GiB', defaultRam: 512 },
    { value: 32, label: getPlotSize(32), workspace: '239GiB', defaultRam: 3390 },
    { value: 33, label: getPlotSize(33), workspace: '521GiB', defaultRam: 7400 },
    // workspace are guesses using 55.35% - rounded up - past here
    { value: 34, label: getPlotSize(34), workspace: '1041GiB', defaultRam: 14_800 },
    { value: 35, label: getPlotSize(35), workspace: '2175GiB', defaultRam: 29_600 },
  ],
  [PlotterName.BLADEBIT_RAM]: [{ value: 32, label: getPlotSize(32), workspace: '416GiB', defaultRam: 3390 }],
  [PlotterName.BLADEBIT_DISK]: [{ value: 32, label: getPlotSize(32), workspace: '480GiB', defaultRam: 3390 }],
  [PlotterName.BLADEBIT_CUDA]: [{ value: 32, label: getPlotSize(32), workspace: '128GiB', defaultRam: 128_000 }],
};

export function getPlotSizeOptions(plotterName: PlotterName) {
  return plottingInfo[plotterName].map((item) => ({
    value: item.value,
    label: `${item.label} (k=${item.value}, temporary space: ${item.workspace})`,
  }));
}
