import { DropdownBase } from '@chia-network/core';
import { WalletConnect } from '@chia-network/icons';
import { Box, Button } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import useWalletConnectContext from '../../hooks/useWalletConnectContext';
import WalletConnectConnections from './WalletConnectConnections';

export default function WalletConnectDropdown() {
  const { enabled, pairs, isLoading } = useWalletConnectContext();

  const ButtonStyled = styled(Button)`
    height: 40px;
    border: 1px solid ${(props) => props.theme.palette.border.main};
    &:hover {
      border: 1px solid ${(props) => props.theme.palette.border.main};
    }
  `;

  const color = enabled && !isLoading && pairs.get().length > 0 ? 'primary' : 'secondary';

  return (
    <DropdownBase>
      {({ onClose, onToggle }) => [
        <ButtonStyled
          key="button"
          onClick={onToggle}
          variant="outlined"
          color="secondary"
          size="small"
          sx={{ px: 1, minWidth: 0 }}
        >
          <WalletConnect color={color} />
        </ButtonStyled>,
        <Box sx={{ minWidth: 360 }}>
          <WalletConnectConnections onClose={onClose} />
        </Box>,
      ]}
    </DropdownBase>
  );
}
