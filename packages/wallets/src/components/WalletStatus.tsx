import { SyncingStatus } from '@chia-network/api';
import { useGetSyncStatusQuery } from '@chia-network/api-react';
import { Loading, State, StateIndicator } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import React from 'react';

import getWalletSyncingStatus from '../utils/getWalletSyncingStatus';
import WalletStatusHeight from './WalletStatusHeight';

export type WalletStatusProps = {
  variant?: string;
  indicator?: boolean;
  height?: boolean;
  reversed?: boolean;
  color?: string;
  gap?: number;
  justChildren?: boolean;
  hideTitle?: boolean;
};

export default function WalletStatus(props: WalletStatusProps) {
  const {
    variant = 'body1',
    height = false,
    indicator = false,
    reversed = false,
    color,
    gap,
    justChildren = false,
    hideTitle = false,
  } = props;
  const { data: walletState, isLoading } = useGetSyncStatusQuery(
    {},
    {
      pollingInterval: 10_000,
    }
  );

  if (isLoading || !walletState) {
    return <Loading size={14} />;
  }

  const syncingStatus = getWalletSyncingStatus(walletState);
  const Tag = justChildren ? Box : Typography;

  return (
    <Tag component="div" variant={variant}>
      {syncingStatus === SyncingStatus.NOT_SYNCED && (
        <StateIndicator
          state={State.WARNING}
          indicator={indicator}
          reversed={reversed}
          color={color}
          gap={gap}
          hideTitle={hideTitle}
        >
          <Trans>Not Synced</Trans> {height && <WalletStatusHeight />}
        </StateIndicator>
      )}
      {syncingStatus === SyncingStatus.SYNCED && (
        <StateIndicator
          state={State.SUCCESS}
          indicator={indicator}
          reversed={reversed}
          color={color}
          gap={gap}
          hideTitle={hideTitle}
        >
          <Trans>Synced</Trans> {height && <WalletStatusHeight />}
        </StateIndicator>
      )}
      {syncingStatus === SyncingStatus.SYNCING && (
        <StateIndicator
          state={State.WARNING}
          indicator={indicator}
          reversed={reversed}
          color={color}
          gap={gap}
          hideTitle={hideTitle}
        >
          <Trans>Syncing</Trans> {height && <WalletStatusHeight />}
        </StateIndicator>
      )}
    </Tag>
  );
}
