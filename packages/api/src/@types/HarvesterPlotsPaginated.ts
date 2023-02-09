import type Plot from './Plot';

type HarvesterPlotsPaginated = {
  nodeId: string;
  page: number;
  pageCount: number;
  totalCount: number;
  plots: Plot[];
};

export default HarvesterPlotsPaginated;
