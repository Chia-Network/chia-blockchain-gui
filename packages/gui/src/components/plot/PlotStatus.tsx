import { Flex, Indicator, TooltipIcon } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import FarmerStatus from '../../constants/FarmerStatus';
import useFarmerStatus from '../../hooks/useFarmerStatus';
import type Plot from '../../types/Plot';

const Title = {
  [FarmerStatus.FARMING]: <Trans>Farming</Trans>,
  [FarmerStatus.SYNCHING]: <Trans>Syncing</Trans>,
  [FarmerStatus.NOT_AVAILABLE]: <Trans>Not Available</Trans>,
  [FarmerStatus.NOT_CONNECTED]: <Trans>Error</Trans>,
  [FarmerStatus.NOT_RUNNING]: <Trans>Error</Trans>,
};

const Description = {
  [FarmerStatus.FARMING]: null,
  [FarmerStatus.SYNCHING]: <Trans>Wait for synchronization</Trans>,
  [FarmerStatus.NOT_AVAILABLE]: <Trans>Wait for synchronization</Trans>,
  [FarmerStatus.NOT_CONNECTED]: <Trans>Farmer is not connected</Trans>,
  [FarmerStatus.NOT_RUNNING]: <Trans>Farmer is not running</Trans>,
};

type Props = {
  plot?: Plot;
};

export default function PlotStatus(props: Props) {
  const { plot } = props;
  const theme = useTheme();
  const palette = theme.palette as typeof theme.palette & {
    danger?: { main: string };
    highlight?: { main: string };
  };
  const { farmerStatus } = useFarmerStatus();
  const color = {
    [FarmerStatus.FARMING]: palette.primary.main,
    [FarmerStatus.SYNCHING]: palette.highlight?.main ?? palette.warning.main,
    [FarmerStatus.NOT_AVAILABLE]: palette.highlight?.main ?? palette.warning.main,
    [FarmerStatus.NOT_CONNECTED]: palette.danger?.main ?? palette.error.main,
    [FarmerStatus.NOT_RUNNING]: palette.danger?.main ?? palette.error.main,
  }[farmerStatus];
  const title = Title[farmerStatus];
  const description = Description[farmerStatus];

  if (!plot) {
    return null;
  }

  return (
    <Indicator color={color}>
      <Flex alignItems="center" gap={1}>
        <span>{title}</span>
        {description && <TooltipIcon>{description}</TooltipIcon>}
      </Flex>
    </Indicator>
  );
}
