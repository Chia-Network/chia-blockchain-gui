import React from 'react';
import { DropdownIconButton } from '@chia/core';
import { Box } from '@mui/material';
import { WalletConnect } from '@chia/icons';
import WalletConnectConnections from './WalletConnectConnections';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';

export default function WalletConnectDropdown() {
  const { enabled, pairs, isLoading } = useWalletConnectContext();

  const color = enabled && !isLoading && pairs.get().length > 0 ? 'primary' : 'secondary';

  return (
    <DropdownIconButton icon={<WalletConnect color={color} />}>
      {({ onClose }) => (
        <Box sx={{ minWidth: 360 }}>
          <WalletConnectConnections onClose={onClose} />
        </Box>
      )}
    </DropdownIconButton>
  );
}
