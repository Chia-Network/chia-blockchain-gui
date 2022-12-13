import { useGetBlockchainStateQuery } from '@chia-network/api-react';
import { FormatLargeNumber, CardSimple, StateColor } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';
import styled from 'styled-components';

const StyledWarning = styled.span`
  color: ${StateColor.WARNING};
`;

function getData(sync) {
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
        <StyledWarning>
          <Trans>
            Syncing <FormatLargeNumber value={progress} />/
            <FormatLargeNumber value={tip} />
          </Trans>
        </StyledWarning>
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
    color: 'primary',
    tooltip: <Trans>This node is fully caught up and validating the network</Trans>,
  };
}

export default function FullNodeCardStatus() {
  const {
    data: state,
    isLoading,
    error,
  } = useGetBlockchainStateQuery(
    {},
    {
      pollingInterval: 10_000,
    }
  );

  if (isLoading) {
    return <CardSimple loading title={<Trans>Status</Trans>} />;
  }

  const { value, tooltip, color } = getData(state?.sync);

  return <CardSimple valueColor={color} title={<Trans>Status</Trans>} tooltip={tooltip} value={value} error={error} />;
}
