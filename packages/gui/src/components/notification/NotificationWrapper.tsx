import { Flex } from '@chia-network/core';
import { Box, MenuItem, Typography } from '@mui/material';
import React, { type ReactNode } from 'react';

export type NotificationWrapperProps = {
  error?: Error;
  onClick?: () => void;
  children?: ReactNode;
  icon?: ReactNode;
  isLoading?: boolean;
};

export default function NotificationWrapper(props: NotificationWrapperProps) {
  const { onClick, error, children, icon, isLoading } = props;

  return (
    <MenuItem onClick={onClick} disabled={isLoading}>
      <Flex alignItems="flex-start" gap={1} whiteSpace="normal">
        <Box width={40}>{icon}</Box>
        {error ? (
          <Typography color="error">{error.message}</Typography>
        ) : (
          <Flex flexDirection="column">{children}</Flex>
        )}
      </Flex>
    </MenuItem>
  );
}
