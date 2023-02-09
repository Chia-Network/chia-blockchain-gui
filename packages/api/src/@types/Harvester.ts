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

type Harvester = {
  connection: Connection;
  duplicates: string[];
  failedToOpenFilenames: string[];
  noKeyFilenames: string[];
  lastSyncTime?: BigNumber;
  syncing?: HarvesterSyncingStatus;
  totalPlotSize: number;
  plots: Plot[];
};

export type HarvesterSummary = Modify<
  Harvester,
  {
    duplicates: number;
    failedToOpenFilenames: number;
    noKeyFilenames: number;
    plots: number;
  }
>;

export default Harvester;
