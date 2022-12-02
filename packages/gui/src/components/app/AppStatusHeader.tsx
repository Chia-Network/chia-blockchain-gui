import React, { useState } from 'react';
import { Trans } from '@lingui/macro';
import { Flex, useMode, Mode } from '@chia/core';
import { Box, ButtonGroup, Button, Popover } from '@mui/material';
import { WalletConnections, WalletStatus } from '@chia/wallets';
import Connections from '../fullNode/FullNodeConnections';
import FullNodeStateIndicator from '../fullNode/FullNodeStateIndicator';
import WalletConnectDropdown from '../walletConnect/WalletConnectDropdown';

export default function AppStatusHeader() {
  const [mode] = useMode();

  const [anchorElFN, setAnchorElFN] = useState<HTMLButtonElement | null>(null);
  const [anchorElW, setAnchorElW] = useState<HTMLButtonElement | null>(null);

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
      <WalletConnectDropdown />
      <ButtonGroup variant="outlined" color="secondary" size="small">
        {mode === Mode.FARMING && (
          <>
            <Button
              onClick={handleClickFN}
              aria-describedby="fullnode-connections"
            >
              <Flex gap={1} alignItems="center">
                <FullNodeStateIndicator />
                <Trans>Full Node</Trans>
              </Flex>
            </Button>
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
        <Button onClick={handleClickW}>
          <Flex gap={1} alignItems="center">
            <WalletStatus indicator hideTitle />
            <Trans>Wallet</Trans>
          </Flex>
        </Button>
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
    </Flex>
  );
}
