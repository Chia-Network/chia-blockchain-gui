import { Trans } from '@lingui/macro';
import { Grid, Typography } from '@mui/material';
import React from 'react';

import FarmCardTotalNetworkSpace from './TotalNetworkSpace';
import FarmCardTotalSizeOfPlots from './TotalSizeOfPlots';

export default React.memo(NetSpaceCards);
function NetSpaceCards() {
  return (
    <div>
      <Typography variant="h5" sx={{ marginBottom: 1 }}>
        <Trans>Netspace</Trans>
      </Typography>
      <Grid spacing={2} alignItems="stretch" container>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardTotalNetworkSpace />
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FarmCardTotalSizeOfPlots />
        </Grid>
      </Grid>
    </div>
  );
}
