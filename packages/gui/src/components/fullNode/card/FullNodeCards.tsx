import { Grid } from '@mui/material';
import React from 'react';

import FullNodeCardConnectionStatus from './FullNodeCardConnectionStatus';
import FullNodeCardDifficulty from './FullNodeCardDifficulty';
import FullNodeCardNetworkName from './FullNodeCardNetworkName';
import FullNodeCardPeakHeight from './FullNodeCardPeakHeight';
import FullNodeCardPeakTime from './FullNodeCardPeakTime';
import FullNodeCardStatus from './FullNodeCardStatus';
import FullNodeCardTotalIterations from './FullNodeCardTotalIterations';
import FullNodeCardVDFSubSlotIterations from './FullNodeCardVDFSubSlotIterations';
import FullNodeEstimatedNetworkSpace from './FullNodeEstimatedNetworkSpace';

export default function FullNodeCards() {
  return (
    <div>
      <Grid spacing={2} alignItems="stretch" container>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardStatus />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardConnectionStatus />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardNetworkName />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardPeakHeight />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardPeakTime />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardDifficulty />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardVDFSubSlotIterations />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FullNodeCardTotalIterations />
        </Grid>
        <Grid xs={12} md={4} item>
          <FullNodeEstimatedNetworkSpace />
        </Grid>
      </Grid>
    </div>
  );
}
