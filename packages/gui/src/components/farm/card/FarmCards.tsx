import { Grid } from '@mui/material';
import React from 'react';

import ExpectedTimeToWin from './ExpectedTimeToWin';
import FarmCardBlockRewards from './FarmCardBlockRewards';
import FarmCardLastHeightFarmed from './FarmCardLastHeightFarmed';
import FarmCardPlotCount from './FarmCardPlotCount';
import FarmCardStatus from './FarmCardStatus';
import FarmCardTotalChiaFarmed from './FarmCardTotalChiaFarmed';
import FarmCardUserFees from './FarmCardUserFees';
import FarmCardTotalNetworkSpace from './TotalNetworkSpace';
import FarmCardTotalSizeOfPlots from './TotalSizeOfPlots';

export default function FarmCards() {
  return (
    <div>
      <Grid spacing={2} alignItems="stretch" container>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardStatus />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardTotalChiaFarmed />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardBlockRewards />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardUserFees />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardLastHeightFarmed />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardPlotCount />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardTotalSizeOfPlots />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardTotalNetworkSpace />
        </Grid>
        <Grid xs={12} md={4} item>
          <ExpectedTimeToWin />
        </Grid>
      </Grid>
    </div>
  );
}
