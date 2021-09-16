import PlotterOptions from './PlotterOptions';

type PlotterDefaults = {
  plotterName: string,
  plotSize: number;
  numThreads: number;
  numBuckets: number | null;
  madmaxNumBucketsPhase3: number | null;
  madmaxThreadMultiplier: number | null;
  madmaxWaitForCopy: boolean | null;
  madmaxTempToggle: boolean | null;
  bladebitWarmStart: boolean | null;
  bladebitDisableNUMA: boolean | null;
  bladebitOutputDir: string | null;
  disableBitfieldPlotting: boolean | null;
  parallel: boolean | null;
  delay: number | null;
};

type Plotter = {
  displayName: string;
  version: string;
  options: PlotterOptions;
  defaults: PlotterDefaults;
};

export default Plotter;
