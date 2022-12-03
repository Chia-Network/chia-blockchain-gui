import { Flex, useMode, Mode, useDarkMode } from '@chia-network/core';
import { WalletConnections, WalletStatus, WalletReceiveAddressField } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import { Box, ButtonGroup, Button, Popover } from '@mui/material';
import React, { useState } from 'react';
import styled from 'styled-components';

import Connections from '../fullNode/FullNodeConnections';
import FullNodeStateIndicator from '../fullNode/FullNodeStateIndicator';
import NotificationsDropdown from '../notification/NotificationsDropdown';
import WalletConnectDropdown from '../walletConnect/WalletConnectDropdown';

export default function AppStatusHeader() {
  const ButtonStyled = styled(Button)`
    padding-top: 3px;
    padding-bottom: 0;
    border: 1px solid ${(props: any) => props.theme.palette.border.main};
    &:hover {
      border: 1px solid ${(props: any) => props.theme.palette.border.main};
    }
    white-space: nowrap;
  `;
  const [mode] = useMode();

  const [anchorElFN, setAnchorElFN] = useState<HTMLButtonElement | null>(null);
  const [anchorElW, setAnchorElW] = useState<HTMLButtonElement | null>(null);
  const { isDarkMode } = useDarkMode();

  const handleClickFN = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElFN(event.currentTarget);
  };

  const handleCloseFN = () => {
    setAnchorElFN(null);
  };

  const handleClickW = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElW(event.currentTarget);
  };

  const handleCloseW = () => {
    setAnchorElW(null);
  };

  return (
    <Flex gap={1}>
      <WalletReceiveAddressField variant="outlined" size="small" fullWidth isDarkMode={isDarkMode} />
      <WalletConnectDropdown />
      <ButtonGroup variant="outlined" color="secondary" size="small">
        {mode === Mode.FARMING && (
          <>
            <Button onClick={handleClickFN} aria-describedby="fullnode-connections">
              <Flex gap={1} alignItems="center">
                <FullNodeStateIndicator />
                <Trans>Full Node</Trans>
              </Flex>
            </ButtonStyled>
            <Popover
              open={!!anchorElFN}
              anchorEl={anchorElFN}
              onClose={handleCloseFN}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Box sx={{ minWidth: 800 }}>
                <Connections />
              </Box>
            </Popover>
          </>
        )}
        <ButtonStyled onClick={handleClickW}>
          <Flex gap={1} alignItems="center">
            <WalletStatus indicator hideTitle />
            <Trans>Wallet</Trans>
          </Flex>
        </ButtonStyled>
        <Popover
          open={!!anchorElW}
          anchorEl={anchorElW}
          onClose={handleCloseW}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ minWidth: 800 }}>
            <WalletConnections walletId={1} />
          </Box>
        </Popover>
      </ButtonGroup>
      <NotificationsDropdown />
    </Flex>
  );
}
