import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import WalletCardPendingTotalBalance from './card/WalletCardPendingTotalBalance';

type Props = {
  walletId: number;
  pendingTotalBalanceTooltip?: ReactElement<any>;
};

export default function WalletCards(props: Props) {
  const {
    walletId,
    pendingTotalBalanceTooltip,
  } = props;

  return (
    <div>
      <Grid spacing={3} alignItems="stretch" container>
        <Grid xs={12} item>
          <WalletCardPendingTotalBalance
            walletId={walletId}
            tooltip={pendingTotalBalanceTooltip}
          />
        </Grid>
      </Grid>
    </div>
  );
}

WalletCards.defaultProps = {
  pendingTotalBalanceTooltip: undefined,
};
