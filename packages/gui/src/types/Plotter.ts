interface CommonOptions {
  kSizes: number[];
  haveNumBuckets: boolean;
  canDisableBitfieldPlotting: boolean;
  canPlotInParallel: boolean;
  canDelayParallelPlots: boolean;
  canSetBufferSize: boolean;
}

interface BladeBitRamOptions extends CommonOptions {
  haveBladebitWarmStart: boolean;
  haveBladebitDisableNUMA: boolean;
  haveBladebitNoCpuAffinity: boolean;
  haveBladebitOutputDir: boolean;
}

interface BladeBitDiskOptions extends BladeBitRamOptions {
  haveBladebitDiskCache: boolean;
  haveBladebitDiskF1Threads: boolean;
  haveBladebitDiskFpThreads: boolean;
  haveBladebitDiskCThreads: boolean;
  haveBladebitDiskP2Threads: boolean;
  haveBladebitDiskP3Threads: boolean;
  haveBladebitDiskAlternate: boolean;
  haveBladebitDiskNoT1Direct: boolean;
  haveBladebitDiskNoT2Direct: boolean;
}

interface MadMaxOptions extends CommonOptions {
  haveMadmaxNumBucketsPhase3: boolean;
  haveMadmaxThreadMultiplier: boolean;
  haveMadmaxTempToggle: boolean;
}

export type PlotterOptions = CommonOptions & BladeBitRamOptions & BladeBitDiskOptions & MadMaxOptions;

interface CommonDefaults {
  plotterName: string;
  plotSize: number;
  numThreads: number;
  numBuckets?: number;
  disableBitfieldPlotting?: boolean;
  parallel?: boolean;
  delay?: number;
}

interface BladeBitRamDefaults extends CommonDefaults {
  plotType?: 'ramplot' | 'diskplot';
  bladebitWarmStart?: boolean;
  bladebitDisableNUMA?: boolean;
  bladebitNoCpuAffinity?: boolean;
}

interface BladeBitDiskDefaults extends BladeBitRamDefaults {
  bladebitDiskCache?: number;
  bladebitDiskF1Threads?: number;
  bladebitDiskFpThreads?: number;
  bladebitDiskCThreads?: number;
  bladebitDiskP2Threads?: number;
  bladebitDiskP3Threads?: number;
  bladebitDiskAlternate?: boolean;
  bladebitDiskNoT1Direct?: boolean;
  bladebitDiskNoT2Direct?: boolean;
}

interface MadMaxDefaults extends CommonDefaults {
  madmaxNumBucketsPhase3?: number;
  madmaxThreadMultiplier?: number;
  madmaxWaitForCopy?: boolean;
  madmaxTempToggle?: boolean;
}

export type PlotterDefaults = CommonDefaults & BladeBitRamDefaults & BladeBitDiskDefaults & MadMaxDefaults;

type PlotterInstallInfo = {
  version?: string;
  installed: boolean;
  canInstall?: boolean;
  bladebitMemoryWarning?: string;
};

type Plotter = {
  displayName: string;
  version?: string;
  options: PlotterOptions;
  defaults: PlotterDefaults;
  installInfo: PlotterInstallInfo;
};

export type PlotterMap<T extends string, U> = {
  [K in T]?: U;
};

export default Plotter;
