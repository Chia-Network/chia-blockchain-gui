import { Flex, useMode, Mode, useDarkMode } from '@chia-network/core';
import { WalletConnections, WalletStatus, WalletReceiveAddressField } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import { Box, ButtonGroup, Button, Popover, PopoverProps } from '@mui/material';
import { useTheme, styled, alpha } from '@mui/material/styles';
import React, { useState } from 'react';

import Connections from '../fullNode/FullNodeConnections';
import FullNodeStateIndicator from '../fullNode/FullNodeStateIndicator';
import NotificationsDropdown from '../notification/NotificationsDropdown';
import WalletConnectDropdown from '../walletConnect/WalletConnectDropdown';
import AppTestnetIndicator from './AppTestnetIndicator';

const StyledPopover = styled((props: PopoverProps) => <Popover {...props} />)(({ theme }) => ({
  '& .MuiPopover-paper': {
    borderRadius: '8px',
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      },
    },
  },
}));

export default function AppStatusHeader() {
  const theme = useTheme();
  const { isDarkMode } = useDarkMode();
  const borderColor = (theme.palette as any).border[isDarkMode ? 'dark' : 'main'];
  const ButtonStyle = {
    paddingTop: '3px',
    paddingBottom: 0,
    paddingLeft: '3px',
    borderRadius: 2,
    border: `1px solid ${borderColor}`,
    '&:hover': {
      border: `1px solid ${borderColor}`,
    },
    whiteSpace: 'nowrap',
  };

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
      <AppTestnetIndicator />
      <WalletReceiveAddressField variant="outlined" size="small" fullWidth isDarkMode={isDarkMode} />
      <WalletConnectDropdown />
      <ButtonGroup variant="outlined" color="secondary" size="small">
        {mode === Mode.FARMING && (
          <>
            <Button onClick={handleClickFN} aria-describedby="fullnode-connections" sx={ButtonStyle}>
              <Flex gap={1} alignItems="center">
                <FullNodeStateIndicator />
                <Trans>Full Node</Trans>
              </Flex>
            </Button>
            <StyledPopover
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
            </StyledPopover>
          </>
        )}
        <Button onClick={handleClickW} sx={ButtonStyle}>
          <Flex gap={1} alignItems="center">
            <WalletStatus indicator hideTitle />
            <Trans>Wallet</Trans>
          </Flex>
        </Button>
        <StyledPopover
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
        </StyledPopover>
      </ButtonGroup>
      <NotificationsDropdown />
    </Flex>
  );
}
