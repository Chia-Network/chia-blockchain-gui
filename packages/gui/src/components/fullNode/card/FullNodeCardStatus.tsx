import { useGetBlockchainStateQuery } from '@chia-network/api-react';
import { FormatLargeNumber, CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { getSemanticColors } from '../../../util/semanticColors';

function getData(sync: any, warningColor: string) {
  if (!sync) {
    return {
      value: <Trans>Not Synced</Trans>,
      color: 'error',
      tooltip: <Trans>The node is not synced</Trans>,
    };
  }

  if (sync.syncMode) {
    const progress = sync.syncProgressHeight;
    const tip = sync.syncTipHeight;

    return {
      value: (
        <span style={{ color: warningColor }}>
          <Trans>
            Syncing <FormatLargeNumber value={progress} />/
            <FormatLargeNumber value={tip} />
          </Trans>
        </span>
      ),
      color: 'error',
      tooltip: (
        <Trans>
          The node is syncing, which means it is downloading blocks from other nodes, to reach the latest block in the
          chain
        </Trans>
      ),
    };
  }
  if (!sync.synced) {
    return {
      value: <Trans>Not Synced</Trans>,
      color: 'error',
      tooltip: <Trans>The node is not synced</Trans>,
    };
  }
  return {
    value: <Trans>Synced</Trans>,
    color: 'textPrimary',
    tooltip: <Trans>This node is fully caught up and validating the network</Trans>,
  };
}

export default function FullNodeCardStatus() {
  const {
    data: state,
    isLoading,
    error,
  } = useGetBlockchainStateQuery(undefined, {
    pollingInterval: 10_000,
  });
  const theme = useTheme();

  if (isLoading) {
    return <CardSimple loading title={<Trans>Status</Trans>} />;
  }

  const { value, tooltip, color } = getData(state?.sync, getSemanticColors(theme.palette).warning);

  return <CardSimple valueColor={color} title={<Trans>Status</Trans>} tooltip={tooltip} value={value} error={error} />;
}
