type PlotterOptions = {
  kSizes: number[];
  haveNumBuckets: boolean;
  haveMadmaxNumBucketsPhase3: boolean;
  haveMadmaxThreadMultiplier: boolean;
  haveMadmaxWaitForCopy: boolean;
  haveMadmaxTempToggle: boolean;
  haveBladebitWarmStart: boolean;
  haveBladebitDisableNUMA: boolean;
  haveBladebitOutputDir: boolean;
  canDisableBitfieldPlotting: boolean;
  canPlotInParallel: boolean;
  canDelayParallelPlots: boolean;
  canSetBufferSize: boolean;
};

export default PlotterOptions;
