import { Flex, TooltipIcon } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

export type ErrorMessageProps = {
  error: Error;
};

export default function ErrorMessage(props: ErrorMessageProps) {
  const { error } = props;
  return (
    <Flex gap={1} alignItems="center">
      <Trans>Error</Trans>
      <TooltipIcon>
        <Typography variant="inherit">{error.message}</Typography>
      </TooltipIcon>
    </Flex>
  );
}
