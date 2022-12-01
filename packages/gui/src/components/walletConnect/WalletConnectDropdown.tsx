import { DropdownBase } from '@chia/core';
import { WalletConnect } from '@chia/icons';
import { Box, Button } from '@mui/material';
import React from 'react';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import WalletConnectConnections from './WalletConnectConnections';

export default function WalletConnectDropdown() {
  const { enabled, pairs, isLoading } = useWalletConnectContext();

  const color = enabled && !isLoading && pairs.get().length > 0 ? 'primary' : 'secondary';

  return (
    <DropdownBase>
      {({ onClose, onToggle }) => [
        <Button
          key="button"
          onClick={onToggle}
          variant="outlined"
          color="secondary"
          size="small"
          sx={{ px: 1, minWidth: 0 }}
        >
          <WalletConnect color={color} />
        </Button>,
        <Box sx={{ minWidth: 360 }}>
          <WalletConnectConnections onClose={onClose} />
        </Box>,
      ]}
    </DropdownBase>
  );
}
