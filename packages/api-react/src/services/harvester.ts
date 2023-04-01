import { Harvester } from '@chia-network/api';

import { query, mutation } from '../utils/reduxToolkitEndpointAbstractions';
import { apiWithTag } from './farmer';

const apiWithTag2 = apiWithTag.enhanceEndpoints({
  addTagTypes: ['Plots', 'PlotDirectories'],
});

export const harvesterApi = apiWithTag2.injectEndpoints({
  endpoints: (build) => ({
    harvesterPing: query(build, Harvester, 'ping'),

    refreshPlots: mutation(build, Harvester, 'refreshPlots', {
      invalidatesTags: [{ type: 'Harvesters', id: 'LIST' }],
    }),

    deletePlot: build.mutation<
      void,
      {
        filename: string;
      }
    >({
      async queryFn({ filename }, _queryApi, _extraOptions, fetchWithBQ) {
        await fetchWithBQ({
          command: 'deletePlot',
          service: Harvester,
          args: { filename },
        });

        await fetchWithBQ({
          command: 'refreshPlots',
          service: Harvester,
        });
        return { data: undefined };
      },
      invalidatesTags: (_result, _error, { filename }) => [
        { type: 'HarvestersSummary', id: 'LIST' },
        { type: 'HarvesterPlots', id: 'LIST' },
        { type: 'HarvesterPlotsInvalid', id: 'LIST' },
        { type: 'HarvesterPlotsKeysMissing', id: 'LIST' },
        { type: 'HarvesterPlotsDuplicates', id: 'LIST' },
        // TODO all next are deprecated and removed in long run
        { type: 'Plots', id: 'LIST' },
        { type: 'Plots', id: filename },
        { type: 'Harvesters', id: 'LIST' },
      ],
    }),

    getPlotDirectories: query(build, Harvester, 'getPlotDirectories', {
      transformResponse: (response) => response.directories,
      providesTags: (directories) =>
        directories
          ? [
              ...directories.map((directory) => ({ type: 'PlotDirectories', id: directory } as const)),
              { type: 'PlotDirectories', id: 'LIST' },
            ]
          : [{ type: 'PlotDirectories', id: 'LIST' }],
    }),

    addPlotDirectory: mutation(build, Harvester, 'addPlotDirectory', {
      invalidatesTags: (_result, _error, { dirname }) => [
        { type: 'PlotDirectories', id: 'LIST' },
        { type: 'PlotDirectories', id: dirname },
      ],
    }),

    removePlotDirectory: mutation(build, Harvester, 'removePlotDirectory', {
      invalidatesTags: (_result, _error, { dirname }) => [
        { type: 'PlotDirectories', id: 'LIST' },
        { type: 'PlotDirectories', id: dirname },
      ],
    }),
  }),
});

export const {
  useHarvesterPingQuery,
  useRefreshPlotsMutation,
  useDeletePlotMutation,
  useGetPlotDirectoriesQuery,
  useAddPlotDirectoryMutation,
  useRemovePlotDirectoryMutation,
} = harvesterApi;
