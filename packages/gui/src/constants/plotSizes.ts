import PlotterName from './PlotterName';

type PlotSize = {
  effectivePlotSize: string;
  value: number;
  workspace: string;
  defaultRam: number;
};

export const compressedSizes: Record<number, Record<number, string>> = {
  0: { 32: '101.4GiB', 33: '208.8GiB', 34: '429.9GiB', 35: '884.1GiB' },
  1: { 32: '87.5GiB', 33: '179.6GiB', 34: '368.2GiB', 35: '754.3GiB' },
  2: { 32: '86.0GiB', 33: '176.6GiB', 34: '362.1GiB', 35: '742.2GiB' },
  3: { 32: '84.5GiB', 33: '173.4GiB', 34: '355.9GiB', 35: '729.7GiB' },
  4: { 32: '82.9GiB', 33: '170.2GiB', 34: '349.4GiB', 35: '716.8GiB' },
  5: { 32: '81.3GiB', 33: '167.0GiB', 34: '343.0GiB', 35: '704.0GiB' },
  6: { 32: '79.6GiB', 33: '163.8GiB', 34: '336.6GiB', 35: '691.1GiB' },
  7: { 32: '78.0GiB', 33: '160.6GiB', 34: '330.2GiB', 35: '678.3GiB' },
  9: { 32: '75.2GiB', 33: '154.1GiB', 34: '315.5GiB', 35: '645.8GiB' },
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

export function getPlotSizeOptions(plotterName: PlotterName, compressionLevel?: number) {
  return plottingInfo[plotterName].map((item) => {
    const kSize = item.value;
    if (
      typeof compressionLevel !== 'number' ||
      !compressedSizes[compressionLevel] ||
      !compressedSizes[compressionLevel][kSize]
    ) {
      return {
        value: kSize,
        label: `k=${kSize} (Effective plot size: ${item.effectivePlotSize}, Temporary space: ${item.workspace})`,
      };
    }
    const compressedSize = compressedSizes[compressionLevel][kSize];
    return {
      value: kSize,
      label: `k=${kSize} (Effective plot size: ${item.effectivePlotSize}, Compressed plot size: ${compressedSize})`,
    };
  });
}
