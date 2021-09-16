import PlotterNames from './PlotterNames';
import Plotter from 'types/Plotter';

const bladebit: Plotter = {
  displayName: 'BladeBit Chia Plotter',
  version: '1.1.0',
  options: {
    kSizes: [32],
    haveNumBuckets: false,
    haveMadmaxNumBucketsPhase3: false,
    haveMadmaxThreadMultiplier: false,
    haveMadmaxWaitForCopy: false,
    haveMadmaxTempToggle: false,
    haveBladebitWarmStart: true,
    haveBladebitDisableNUMA: true,
    haveBladebitOutputDir: true,
    canDisableBitfieldPlotting: false,
    canPlotInParallel: false,
    canDelayParallelPlots: false,
    canSetBufferSize: false,
  },
  defaults: {
    plotterName: PlotterNames.BLADEBIT,
    plotSize: 32,
    numThreads: 4,
    numBuckets: null,
    madmaxNumBucketsPhase3: null,
    madmaxThreadMultiplier: null,
    madmaxWaitForCopy: null,
    madmaxTempToggle: null,
    bladebitWarmStart: false,
    bladebitDisableNUMA: false,
    bladebitOutputDir: "",
    disableBitfieldPlotting: null,
    parallel: null,
    delay: null,
  },
};

const chiapos: Plotter = {
  displayName: 'Chia Proof of Space',
  version: '1.0.4',
  options: {
    kSizes: [25, 32, 33, 34, 35],
    haveNumBuckets: true,
    haveMadmaxNumBucketsPhase3: false,
    haveMadmaxThreadMultiplier: false,
    haveMadmaxWaitForCopy: false,
    haveMadmaxTempToggle: false,
    haveBladebitWarmStart: false,
    haveBladebitDisableNUMA: false,
    haveBladebitOutputDir: false,
    canDisableBitfieldPlotting: true,
    canPlotInParallel: true,
    canDelayParallelPlots: true,
    canSetBufferSize: true,
  },
  defaults: {
    plotterName: PlotterNames.CHIAPOS,
    plotSize: 32,
    numThreads: 2,
    numBuckets: 128,
    madmaxNumBucketsPhase3: null,
    madmaxThreadMultiplier: null,
    madmaxWaitForCopy: null,
    madmaxTempToggle: null,
    bladebitWarmStart: null,
    bladebitDisableNUMA: null,
    bladebitOutputDir: null,
    disableBitfieldPlotting: false,
    parallel: false,
    delay: 0,
  },
};

const madmax: Plotter = {
  displayName: 'madMAx Chia Plotter',
  version: '0.1.5',
  options: {
    kSizes: [25, 32],
    haveNumBuckets: true,
    haveMadmaxNumBucketsPhase3: true,
    haveMadmaxThreadMultiplier: true,
    haveMadmaxWaitForCopy: true,
    haveMadmaxTempToggle: true,
    haveBladebitWarmStart: false,
    haveBladebitDisableNUMA: false,
    haveBladebitOutputDir: false,
    canDisableBitfieldPlotting: false,
    canPlotInParallel: false,
    canDelayParallelPlots: false,
    canSetBufferSize: false,
  },
  defaults: {
    plotterName: PlotterNames.MADMAX,
    plotSize: 32,
    numThreads: 4,
    numBuckets: 256,
    madmaxNumBucketsPhase3: 256,
    madmaxThreadMultiplier: 1,
    madmaxWaitForCopy: true,
    madmaxTempToggle: false,
    bladebitWarmStart: null,
    bladebitDisableNUMA: null,
    bladebitOutputDir: null,
    disableBitfieldPlotting: null,
    parallel: null,
    delay: null,
  },
};

type PlotterMap<T extends string, U> = {
  [K in T]: U;
};

const Plotters: PlotterMap<PlotterNames, Plotter> = {
  [PlotterNames.BLADEBIT]: bladebit,
  [PlotterNames.CHIAPOS]: chiapos,
  [PlotterNames.MADMAX]: madmax,
};

export default Plotters;
