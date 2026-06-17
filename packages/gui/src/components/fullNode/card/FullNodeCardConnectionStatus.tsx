import { ServiceName } from '@chia-network/api';
import { CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';

import useIsServiceRunning from '../../../hooks/useIsServiceRunning';

export default function FullNodeCardConnectionStatus() {
  const { isRunning, isLoading, error } = useIsServiceRunning(ServiceName.FULL_NODE);

  return (
    <CardSimple
      loading={isLoading}
      valueColor={isRunning ? 'primary' : 'textPrimary'}
      title={<Trans>Connection Status</Trans>}
      value={isRunning ? <Trans>Connected</Trans> : <Trans>Not connected</Trans>}
      error={error}
    />
  );
}
