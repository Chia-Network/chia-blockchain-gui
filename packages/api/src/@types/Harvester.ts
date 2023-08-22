import type BigNumber from 'bignumber.js';

import type Plot from './Plot';
import Modify from './helpers/Modify';

type Connection = {
  host: string;
  nodeId: string;
  port: number;
};

type HarvesterSyncingStatus = {
  initial: boolean;
  plotFilesProcessed: number;
  plotFilesTotal: number;
};

export type CPUHarvesting = 1;
export type GPUHarvesting = 2;
export type HarvestingMode = CPUHarvesting | GPUHarvesting;

type HarvesterInfo = {
  connection: Connection;
  duplicates: string[];
  failedToOpenFilenames: string[];
  noKeyFilenames: string[];
  lastSyncTime?: BigNumber;
  syncing?: HarvesterSyncingStatus;
  totalPlotSize: number;
  totalEffectivePlotSize: number;
  plots: Plot[];
  harvestingMode?: HarvestingMode;
};

export type HarvesterSummary = Modify<
  HarvesterInfo,
  {
    duplicates: number;
    failedToOpenFilenames: number;
    noKeyFilenames: number;
    plots: number;
  }
>;

export default HarvesterInfo;
