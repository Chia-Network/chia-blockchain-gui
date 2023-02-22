import { PlotterService } from '@chia-network/api';

import api, { baseQuery } from '../api';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';
import { query } from '../utils/reduxToolkitEndpointAbstractions';

const apiWithTag = api.enhanceEndpoints({ addTagTypes: ['PlotQueue'] });

export const plotterApi = apiWithTag.injectEndpoints({
  endpoints: (build) => ({
    getPlotQueue: query(build, PlotterService, 'getQueue', {
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [
        {
          command: 'onQueueChanged',
          service: PlotterService,
          endpoint: () => plotterApi.endpoints.getPlotQueue,
        },
      ]),
    }),
  }),
});

export const { useGetPlotQueueQuery } = plotterApi;
