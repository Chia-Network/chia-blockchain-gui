import { Color, Flex, useMode, Mode, useDarkMode, useAuth, Tooltip } from '@chia-network/core';
import { WalletConnections, WalletStatus, WalletReceiveAddressField } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { Box, ButtonGroup, Button, Popover, PopoverProps, IconButton } from '@mui/material';
import { useTheme, styled, alpha } from '@mui/material/styles';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    color: theme.palette.mode === 'light' ? Color.Comet[700] : theme.palette.grey[300],
    boxShadow: `${Color.Neutral[50]} 0px 0px 0px 0px, ${alpha(
      Color.Neutral[900],
      theme.palette.mode === 'dark' ? 0.15 : 0.05
    )} 0px 0px 0px 1px, ${alpha(
      Color.Neutral[900],
      theme.palette.mode === 'dark' ? 0.01 : 0.1
    )} 0px 10px 15px -3px, ${alpha(Color.Neutral[900], theme.palette.mode === 'dark' ? 0.15 : 0.05)} 0px 4px 6px -2px`,
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
    '.cancel-icon': {
      g: {
        circle: {
          stroke: Color.Red[600],
          fill: Color.Red[600],
        },
      },
    },
    '.checkmark-icon': {
      g: {
        circle: {
          stroke: theme.palette.primary.main,
          fill: theme.palette.primary.main,
        },
        path: {
          stroke: theme.palette.primary.main,
          fill: theme.palette.primary.main,
        },
      },
    },
    '.reload-icon': {
      g: {
        circle: {
          stroke: Color.Orange[400],
          fill: Color.Orange[400],
        },
        path: {
          fill: Color.Orange[400],
        },
      },
    },
  };

  const [mode] = useMode();
  const navigate = useNavigate();
  const { logOut } = useAuth();

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

  async function handleLogout() {
    await logOut();

    navigate('/');
  }

  return (
    <Flex flexGrow={1} gap={2} flexWrap="wrap" alignItems="center">
      <AppTestnetIndicator />
      <WalletReceiveAddressField variant="outlined" size="small" fullWidth isDarkMode={isDarkMode} />
      <Flex flexGrow={1} gap={2} alignItems="center" justifyContent="space-between">
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
        <Flex gap={0.5} alignItems="center">
          <WalletConnectDropdown />
          <NotificationsDropdown />
          <Tooltip title={<Trans>Log Out</Trans>}>
            <IconButton onClick={handleLogout} data-testid="AppStatusHeader-log-out">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
    </Flex>
  );
}
