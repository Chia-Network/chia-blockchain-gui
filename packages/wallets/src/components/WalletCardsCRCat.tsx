import { Grid } from '@mui/material';
import React from 'react';

import WalletCardCRCatApprove from './card/WalletCardCRCatApprove';
import WalletCardCRCatRestrictions from './card/WalletCardCRCatRestrictions';

export type WalletCardsCRCatProps = {
  walletId: number;
};

export default function WalletCardsCRCat(props: WalletCardsCRCatProps) {
  const { walletId } = props;

  return (
    <div>
      <Grid spacing={2} alignItems="stretch" container>
        <Grid xs={12} md={6} lg={4} item>
          <WalletCardCRCatApprove walletId={walletId} />
        </Grid>
        <Grid xs={12} md={6} lg={8} item>
          <WalletCardCRCatRestrictions walletId={walletId} />
        </Grid>
      </Grid>
    </div>
  );
}
