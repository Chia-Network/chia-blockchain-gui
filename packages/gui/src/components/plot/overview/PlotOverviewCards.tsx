import { Grid } from '@mui/material';
import React from 'react';

import PlotCardNotFound from '../card/PlotCardNotFound';
import PlotCardPlotsDuplicate from '../card/PlotCardPlotsDuplicate';
import PlotCardPlotsFailedToOpen from '../card/PlotCardPlotsFailedToOpen';
import PlotCardTotalHarvesters from '../card/PlotCardTotalHarvesters';
import PlotCardTotalPlots from '../card/PlotCardTotalPlots';
import PlotCardTotalPlotsSize from '../card/PlotCardTotalPlotsSize';

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
          <PlotCardTotalPlotsSize />
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
