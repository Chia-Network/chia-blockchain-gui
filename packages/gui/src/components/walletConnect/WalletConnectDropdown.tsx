import { DropdownBase, useDarkMode } from '@chia-network/core';
import { WalletConnect } from '@chia-network/icons';
import { Box, Button } from '@mui/material';
import React from 'react';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import WalletConnectConnections from './WalletConnectConnections';

export default function WalletConnectDropdown() {
  const { enabled, pairs, isLoading } = useWalletConnectContext();

  const { isDarkMode } = useDarkMode();

  const ButtonStyle = {
    minWidth: 0,
    height: '42px',
    '&:hover': {
      backgroundColor: isDarkMode ? '#2c2c2c' : '#eee',
    },
  };

  const color = enabled && !isLoading && pairs.get().length > 0 ? 'primary' : 'info';

  return (
    <DropdownBase>
      {({ onClose, onToggle }: { onClose: () => void; onToggle: () => void }) => [
        <Button key="button" onClick={onToggle} variant="text" size="small" sx={ButtonStyle}>
          <WalletConnect color={color} />
        </Button>,
        <Box sx={{ minWidth: 360 }}>
          <WalletConnectConnections onClose={onClose} />
        </Box>,
      ]}
    </DropdownBase>
  );
}
