import { Grid } from '@mui/material';
import React, { ReactElement } from 'react';

import WalletCardPendingBalance from './card/WalletCardPendingBalance';
import WalletCardPendingChange from './card/WalletCardPendingChange';
import WalletCardPendingTotalBalance from './card/WalletCardPendingTotalBalance';
import WalletCardSpendableBalance from './card/WalletCardSpendableBalance';
import WalletCardTotalBalance from './card/WalletCardTotalBalance';

export type WalletCardsProps = {
  walletId: number;
  totalBalanceTooltip?: ReactElement<any>;
  spendableBalanceTooltip?: ReactElement<any>;
  pendingTotalBalanceTooltip?: ReactElement<any>;
  pendingBalanceTooltip?: ReactElement<any>;
  pendingChangeTooltip?: ReactElement<any>;
};

export default function WalletCards(props: WalletCardsProps) {
  const {
    walletId,
    totalBalanceTooltip,
    spendableBalanceTooltip,
    pendingTotalBalanceTooltip,
    pendingBalanceTooltip,
    pendingChangeTooltip,
  } = props;

  return (
    <div>
      <Grid spacing={2} alignItems="stretch" container>
        <Grid xs={12} lg={4} item>
          <WalletCardTotalBalance walletId={walletId} tooltip={totalBalanceTooltip} />
        </Grid>
        <Grid xs={12} lg={8} item>
          <Grid spacing={2} alignItems="stretch" container>
            <Grid xs={12} md={6} item>
              <WalletCardSpendableBalance walletId={walletId} tooltip={spendableBalanceTooltip} />
            </Grid>
            <Grid xs={12} md={6} item>
              <WalletCardPendingTotalBalance walletId={walletId} tooltip={pendingTotalBalanceTooltip} />
            </Grid>
            <Grid xs={12} md={6} item>
              <WalletCardPendingBalance walletId={walletId} tooltip={pendingBalanceTooltip} />
            </Grid>
            <Grid xs={12} md={6} item>
              <WalletCardPendingChange walletId={walletId} tooltip={pendingChangeTooltip} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
