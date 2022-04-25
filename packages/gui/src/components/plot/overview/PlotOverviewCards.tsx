import React from 'react';
import { Grid } from '@mui/material';
import PlotCardTotalHarvesters from '../card/PlotCardTotalHarvesters';
import PlotCardTotalPlots from '../card/PlotCardTotalPlots';
import PlotCardNotFound from '../card/PlotCardNotFound';
import PlotCardPlotsProcessed from '../card/PlotCardPlotsProcessed';
import PlotCardPlotsFailedToOpen from '../card/PlotCardPlotsFailedToOpen';
import PlotCardPlotsDuplicate from '../card/PlotCardPlotsDuplicate';

export default function PlotOverviewCards() {
  return (
    <div>
      <Grid spacing={2} alignItems="stretch" container>
        <Grid xs={12} sm={6} md={4} item>
          <PlotCardTotalHarvesters />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <PlotCardTotalPlots />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <PlotCardPlotsProcessed />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <PlotCardNotFound />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <PlotCardPlotsFailedToOpen />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <PlotCardPlotsDuplicate />
        </Grid>
      </Grid>
    </div>
  );
}

/*
isLoading: boolean;
error?: Error;
hasPlots: boolean;
plots: number;
uniquePlots: number;
noKeyFilenames: number;
failedToOpenFilenames: number;
duplicates: number;
harvesters: number;
plotsProcessed: number;
plotsLoaded: number;
*/
