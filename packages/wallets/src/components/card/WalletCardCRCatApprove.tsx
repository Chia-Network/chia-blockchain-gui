import { useGetWalletBalanceQuery } from '@chia-network/api-react';
import { CardSimple, Button } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box } from '@mui/material';
import React, { useCallback } from 'react';

import useWallet from '../../hooks/useWallet';
import useWalletHumanValue from '../../hooks/useWalletHumanValue';
import CrCatApprovePendingDialog from '../CrCatApprovePendingDialog';

type Props = {
  walletId: number;
};

export default function WalletCardCRCatApprove(props: Props) {
  const { walletId } = props;

  const {
    data: walletBalance,
    isLoading: isLoadingWalletBalance,
    error,
    refetch,
  } = useGetWalletBalanceQuery(
    {
      walletId,
    },
    {
      pollingInterval: 10_000,
    }
  );

  const { wallet, unit = '', loading } = useWallet(walletId);

  const isLoading = loading || isLoadingWalletBalance;
  const value = walletBalance?.pendingApprovalBalance || 0;

  const humanValue = useWalletHumanValue(wallet, value, unit);

  const [isCrCatApprovePendingDialogOpen, setIsCrCatApprovePendingDialogOpen] = React.useState<boolean>(false);

  const handleCloseCrCatApprovePendingDialog = useCallback(() => setIsCrCatApprovePendingDialogOpen(false), []);

  return (
    <CardSimple
      loading={isLoading}
      valueColor="secondary"
      title={<Trans>Pending Balance for Approval</Trans>}
      // tooltip={tooltip}
      value={humanValue}
      error={error}
    >
      <CrCatApprovePendingDialog
        walletId={walletId}
        amount={value}
        amountHuman={humanValue}
        onClose={handleCloseCrCatApprovePendingDialog}
        onSuccess={() => {
          refetch();
        }}
        open={isCrCatApprovePendingDialogOpen}
      />
      {value ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              setIsCrCatApprovePendingDialogOpen(true);
            }}
            color="primary"
            variant="contained"
          >
            <Trans>Approve</Trans>
          </Button>
        </Box>
      ) : null}
    </CardSimple>
  );
}
