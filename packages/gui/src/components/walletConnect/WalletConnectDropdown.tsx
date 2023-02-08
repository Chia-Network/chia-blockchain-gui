import { DropdownBase, useDarkMode } from '@chia-network/core';
import { WalletConnect } from '@chia-network/icons';
import { Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import WalletConnectConnections from './WalletConnectConnections';

export default function WalletConnectDropdown() {
  const { enabled, pairs, isLoading } = useWalletConnectContext();
  const theme = useTheme();

  const { isDarkMode } = useDarkMode();

  const borderColor = (theme.palette as any).border[isDarkMode ? 'dark' : 'main'];

  const ButtonStyle = {
    minWidth: 0,
    borderRadius: 2,
    border: `1px solid ${borderColor}`,
    height: '42px',
    '&:hover': {
      border: `1px solid ${borderColor}`,
      backgroundColor: isDarkMode ? '#2c2c2c' : '#eee',
    },
  };

  const color = enabled && !isLoading && pairs.get().length > 0 ? 'primary' : 'secondary';

  return (
    <DropdownBase>
      {({ onClose, onToggle }) => [
        <Button key="button" onClick={onToggle} variant="outlined" size="small" sx={ButtonStyle}>
          <WalletConnect color={color} />
        </Button>,
        <Box sx={{ minWidth: 360 }}>
          <WalletConnectConnections onClose={onClose} />
        </Box>,
      ]}
    </DropdownBase>
  );
}
