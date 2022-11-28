import { useLogout, useGetLoggedInFingerprintQuery, useGetKeyQuery } from '@chia/api-react';
import { t, Trans } from '@lingui/macro';
import { ExitToApp as ExitToAppIcon } from '@mui/icons-material';
import { Box, AppBar, Toolbar, Drawer, Container, IconButton, Typography, CircularProgress } from '@mui/material';
import React, { ReactNode, Suspense } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';

import Flex from '../Flex';
import Loading from '../Loading';
import Logo from '../Logo';
import Settings from '../Settings';
import ToolbarSpacing from '../ToolbarSpacing';
import Tooltip from '../Tooltip';
// import LayoutFooter from '../LayoutMain/LayoutFooter';

const StyledRoot = styled(Flex)`
  height: 100%;
  // overflow: hidden;
`;

const StyledAppBar = styled(({ drawer, ...rest }) => <AppBar {...rest} />)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  width: ${({ theme, drawer }) => (drawer ? `calc(100% - ${theme.drawer.width})` : '100%')};
  margin-left: ${({ theme, drawer }) => (drawer ? theme.drawer.width : 0)};
  z-index: ${({ theme }) => theme.zIndex.drawer + 1};};
`;

const StyledDrawer = styled(Drawer)`
  z-index: ${({ theme }) => theme.zIndex.drawer + 2};
  width: ${({ theme }) => theme.drawer.width};
  flex-shrink: 0;

  > div {
    width: ${({ theme }) => theme.drawer.width};
    // border-width: 0px;
  }
`;

const StyledBody = styled(Flex)`
  min-width: 0;
`;

const StyledToolbar = styled(Toolbar)`
  padding-left: ${({ theme }) => theme.spacing(3)};
  padding-right: ${({ theme }) => theme.spacing(3)};
`;

const StyledInlineTypography = styled(Typography)`
  display: inline-block;
`;

export type LayoutDashboardProps = {
  children?: ReactNode;
  sidebar?: ReactNode;
  outlet?: boolean;
  settings?: ReactNode;
  actions?: ReactNode;
};

export default function LayoutDashboard(props: LayoutDashboardProps) {
  const { children, sidebar, settings, outlet = false, actions } = props;

  const navigate = useNavigate();
  const logout = useLogout();
  const { data: fingerprint, isLoading: isLoadingFingerprint } = useGetLoggedInFingerprintQuery();
  const { data: keyData, isLoading: isLoadingKeyData } = useGetKeyQuery(
    {
      fingerprint,
    },
    {
      skip: !fingerprint,
    }
  );

  const isLoading = isLoadingFingerprint || isLoadingKeyData;

  async function handleLogout() {
    await logout();

    navigate('/');
  }

  return (
    <StyledRoot>
      <Suspense fallback={<Loading center />}>
        {sidebar ? (
          <>
            <StyledAppBar position="fixed" color="transparent" elevation={0} drawer>
              <StyledToolbar>
                <Flex width="100%" alignItems="center" justifyContent="space-between" gap={3}>
                  <Flex
                    alignItems="center"
                    flexGrow={1}
                    justifyContent="space-between"
                    flexWrap="wrap"
                    minWidth={0}
                    gap={1}
                  >
                    <Flex flexGrow={1} minWidth={0}>
                      {isLoading ? (
                        <Box>
                          <CircularProgress size={32} color="secondary" />
                        </Box>
                      ) : (
                        <Flex minWidth={0} alignItems="baseline">
                          <Typography variant="h4" display="flex-inline" noWrap>
                            {keyData?.label || <Trans>Wallet</Trans>}
                          </Typography>
                          {fingerprint && (
                            <StyledInlineTypography
                              color="textSecondary"
                              variant="h5"
                              component="span"
                              data-testid="LayoutDashboard-fingerprint"
                            >
                              &nbsp;
                              {fingerprint}
                            </StyledInlineTypography>
                          )}
                        </Flex>
                      )}
                    </Flex>
                    <Flex alignItems="center" gap={1}>
                      {actions}
                    </Flex>
                  </Flex>
                  <Box>
                    {/*
                        <DropdownIconButton
                          icon={<Notifications />}
                          title={t`Notifications`}
                        >
                          {({ onClose }) => (
                            <MenuItem onClick={onClose}>
                              CAT Wallet TEST is now available
                            </MenuItem>
                          )}
                        </DropdownIconButton>
                        &nbsp;
                        */}
                    <Tooltip title={<Trans>Log Out</Trans>}>
                      <IconButton onClick={handleLogout} data-testid="LayoutDashboard-log-out">
                        <ExitToAppIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Flex>
              </StyledToolbar>
            </StyledAppBar>
            <StyledDrawer variant="permanent">{sidebar}</StyledDrawer>
          </>
        ) : (
          <StyledAppBar position="fixed" color="transparent" elevation={0}>
            <StyledToolbar>
              <Container maxWidth="lg">
                <Flex alignItems="center">
                  <Logo width="100px" />
                  <Flex flexGrow={1} />
                  <Tooltip title={<Trans>Logout</Trans>}>
                    <IconButton color="inherit" onClick={handleLogout} title={t`Log Out`}>
                      <ExitToAppIcon />
                    </IconButton>
                  </Tooltip>
                  <Settings>{settings}</Settings>
                </Flex>
              </Container>
            </StyledToolbar>
          </StyledAppBar>
        )}

        <StyledBody flexDirection="column" flexGrow={1}>
          <ToolbarSpacing />
          <Flex flexDirection="column" gap={2} flexGrow={1} overflow="auto">
            <Suspense fallback={<Loading center />}>{outlet ? <Outlet /> : children}</Suspense>
          </Flex>
        </StyledBody>
      </Suspense>
    </StyledRoot>
  );
}
