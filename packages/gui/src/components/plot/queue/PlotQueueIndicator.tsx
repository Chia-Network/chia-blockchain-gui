import { Color, Flex, Indicator, TooltipIcon, getStateColors } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import PlotStatusEnum from '../../../constants/PlotStatus';
import type PlotQueueItem from '../../../types/PlotQueueItem';

type Props = {
  queueItem: PlotQueueItem;
};

export default function PlotQueueIndicator(props: Props) {
  const {
    queueItem: { error, state, progress },
  } = props;
  const theme = useTheme();

  if (error) {
    return (
      <Indicator color={getStateColors(theme.palette).error}>
        <Flex alignItems="center" gap={1}>
          <Box>
            <Trans>Error</Trans>
          </Box>
          <TooltipIcon>
            <Box>{error}</Box>
          </TooltipIcon>
        </Flex>
      </Indicator>
    );
  }

  return (
    <Indicator color={theme.palette.ink?.muted ?? Color.Neutral[400]} progress={progress}>
      {state === PlotStatusEnum.RUNNING && <Trans>Plotting</Trans>}
      {state === PlotStatusEnum.SUBMITTED && <Trans>Queued</Trans>}
      {state === PlotStatusEnum.REMOVING && <Trans>Removing</Trans>}
    </Indicator>
  );
}
