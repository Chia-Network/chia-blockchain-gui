import PlotterName from './PlotterName';

type PlotSize = {
  effectivePlotSize: string;
  value: number;
  workspace: string;
  defaultRam: number;
};

export function getEffectivePlotSize(kSize: 25 | 32 | 33 | 34 | 35) {
  const sizeInBytes = (2 * kSize + 1) * 2 ** (kSize - 1);
  if (kSize < 32) {
    return `${sizeInBytes / 1024 / 1024}MiBe`;
  }
  return `${sizeInBytes / 1024 / 1024 / 1024}GiBe`;
}

export const plottingInfo: Record<PlotterName, PlotSize[]> = {
  [PlotterName.CHIAPOS]: [
    { value: 25, effectivePlotSize: getEffectivePlotSize(25), workspace: '1.8GiB', defaultRam: 512 },
    { value: 32, effectivePlotSize: getEffectivePlotSize(32), workspace: '239GiB', defaultRam: 3390 },
    { value: 33, effectivePlotSize: getEffectivePlotSize(33), workspace: '521GiB', defaultRam: 7400 },
    // workspace are guesses using 55.35% - rounded up - past here
    { value: 34, effectivePlotSize: getEffectivePlotSize(34), workspace: '1041GiB', defaultRam: 14_800 },
    { value: 35, effectivePlotSize: getEffectivePlotSize(35), workspace: '2175GiB', defaultRam: 29_600 },
  ],
  [PlotterName.MADMAX]: [
    { value: 25, effectivePlotSize: getEffectivePlotSize(25), workspace: '1.8GiB', defaultRam: 512 },
    { value: 32, effectivePlotSize: getEffectivePlotSize(32), workspace: '239GiB', defaultRam: 3390 },
    { value: 33, effectivePlotSize: getEffectivePlotSize(33), workspace: '521GiB', defaultRam: 7400 },
    // workspace are guesses using 55.35% - rounded up - past here
    { value: 34, effectivePlotSize: getEffectivePlotSize(34), workspace: '1041GiB', defaultRam: 14_800 },
    { value: 35, effectivePlotSize: getEffectivePlotSize(35), workspace: '2175GiB', defaultRam: 29_600 },
  ],
  [PlotterName.BLADEBIT_RAM]: [
    { value: 32, effectivePlotSize: getEffectivePlotSize(32), workspace: '416GiB', defaultRam: 3390 },
  ],
  [PlotterName.BLADEBIT_DISK]: [
    { value: 32, effectivePlotSize: getEffectivePlotSize(32), workspace: '480GiB', defaultRam: 3390 },
  ],
  [PlotterName.BLADEBIT_CUDA]: [
    { value: 32, effectivePlotSize: getEffectivePlotSize(32), workspace: '128GiB', defaultRam: 128_000 },
  ],
};

export function getPlotSizeOptions(plotterName: PlotterName) {
  return plottingInfo[plotterName].map((item) => ({
    value: item.value,
    label: `k=${item.value} (Effective plot size: ${item.effectivePlotSize}, Temporary space: ${item.workspace})`,
  }));
}
