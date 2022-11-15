import { Grid } from '@mui/material';
import React from 'react';

import FarmCardBlockRewards from './FarmCardBlockRewards';
import FarmCardExpectedTimeToWin from './FarmCardExpectedTimeToWin';
import FarmCardLastHeightFarmed from './FarmCardLastHeightFarmed';
import FarmCardPlotCount from './FarmCardPlotCount';
import FarmCardStatus from './FarmCardStatus';
import FarmCardTotalChiaFarmed from './FarmCardTotalChiaFarmed';
import FarmCardTotalNetworkSpace from './FarmCardTotalNetworkSpace';
import FarmCardTotalSizeOfPlots from './FarmCardTotalSizeOfPlots';
import FarmCardUserFees from './FarmCardUserFees';

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
          <FarmCardExpectedTimeToWin />
        </Grid>
      </Grid>
    </div>
  );
}
