import { useGetLoggedInFingerprintQuery, useGetKeyQuery, useFingerprintSettings } from '@chia-network/api-react';
import { Trans } from '@lingui/macro';
import { Edit as EditIcon } from '@mui/icons-material';
import { Box, AppBar, Toolbar, Drawer, IconButton, Typography, CircularProgress, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { type ReactNode, useState, Suspense, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

import useGetLatestVersionFromWebsite from '../../hooks/useGetLatestVersionFromWebsite';
import useOpenDialog from '../../hooks/useOpenDialog';
import EmojiAndColorPicker from '../../screens/SelectKey/EmojiAndColorPicker';
import SelectKeyRenameForm from '../../screens/SelectKey/SelectKeyRenameForm';
import useColorModeValue from '../../utils/useColorModeValue';
import Flex from '../Flex';
import Link from '../Link';
import Loading from '../Loading';
import NewerAppVersionAvailable from './NewerAppVersionAvailable';

// import LayoutFooter from '../LayoutMain/LayoutFooter';

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

const StyledToolbar = styled(Toolbar)`
  padding-left: calc(${({ theme }) => theme.spacing(3)} - 12px);
  padding-right: ${({ theme }) => theme.spacing(3)};
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledInlineTypography = styled(Typography)`
  display: inline-block;
`;

export type LayoutDashboardProps = {
  children?: ReactNode;
  sidebar?: ReactNode;
  outlet?: boolean;
  actions?: ReactNode;
};

export default function LayoutDashboard(props: LayoutDashboardProps) {
  const { children, sidebar, outlet = false, actions } = props;

  const [editWalletName, setEditWalletName] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const { data: fingerprint, isLoading: isLoadingFingerprint } = useGetLoggedInFingerprintQuery();
  const { data: keyData, isLoading: isLoadingKeyData } = useGetKeyQuery(
    {
      fingerprint,
    },
    {
      skip: !fingerprint,
    }
  );
  type WalletKeyTheme = {
    emoji: string | null;
    color: string | null;
  };
  const theme: any = useTheme();
  const isColor = useCallback((color: string) => Object.keys(theme.palette.colors).includes(color), [theme]);
  const isDark = theme.palette.mode === 'dark';
  const [walletKeyTheme, setWalletKeyTheme] = useFingerprintSettings<WalletKeyTheme>(fingerprint, 'walletKeyTheme', {
    emoji: ``,
    color: 'green',
  });
  const { appVersion, latestVersion, newVersionAvailable, isVersionSkipped, addVersionToSkip, downloadUrl, blogUrl } =
    useGetLatestVersionFromWebsite();

  const openDialog = useOpenDialog();

  const isLoading = isLoadingFingerprint || isLoadingKeyData;

  React.useEffect(() => {
    function checkForUpdates(ver: string) {
      if (ver) {
        openDialog(<NewerAppVersionAvailable currentVersion={ver} />);
      }
    }
    (window as any).ipcRenderer.on('checkForUpdates', () => checkForUpdates(appVersion));

    // unregister event listener on unmount
    return () => {
      (window as any).ipcRenderer.removeAllListeners('checkForUpdates');
    };
  }, [openDialog, appVersion]);

  function handleEditWalletName() {
    setEditWalletName(true);
  }

  function handleCloseEditWalletName() {
    setEditWalletName(false);
  }

  function isNewVersionBannerShown() {
    return newVersionAvailable && !isVersionSkipped;
  }

  function renderNewVersionBanner() {
    if (isNewVersionBannerShown()) {
      return (
        <Flex
          gap={2}
          flexDirection="row"
          justifyContent="center"
          style={{
            background: theme.palette.sidebarBackground,
            padding: '12px',
            lineHeight: '29px',
            marginBottom: '10px',
            fontSize: '15px',
          }}
        >
          <Trans>New version {latestVersion} available</Trans>
          {latestVersion && (
            <Button color="secondary" variant="outlined" size="small" onClick={() => addVersionToSkip(latestVersion)}>
              <Trans>Skip</Trans>
            </Button>
          )}
          {blogUrl && (
            <Link target="_blank" href={blogUrl} sx={{ textDecoration: 'none !important' }}>
              <Button color="secondary" variant="outlined" size="small" sx={{ boxShadow: 'none' }}>
                <Trans>What's New</Trans>
              </Button>
            </Link>
          )}
          <Link target="_blank" href={downloadUrl} sx={{ textDecoration: 'none !important' }}>
            <Button size="small" variant="contained" color="primary" sx={{ boxShadow: 'none' }}>
              <Trans>Download</Trans>
            </Button>
          </Link>
        </Flex>
      );
    }
    return null;
  }

  return (
    <Flex sx={{ height: '100%' }}>
      <Suspense fallback={<Loading center />}>
        {sidebar ? <StyledDrawer variant="permanent">{sidebar}</StyledDrawer> : null}
        <Flex flexDirection="column" flexGrow={1} sx={{ minWidth: 0 }}>
          <StyledAppBar color="transparent" position="static" elevation={0}>
            {renderNewVersionBanner()}
            <StyledToolbar>
              <Flex width="100%" alignItems="center" gap={2} flexWrap="wrap">
                <Flex
                  alignItems="center"
                  flexGrow={9999}
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
                    ) : editWalletName ? (
                      <Box flexGrow={1} maxWidth={{ md: '80%' }}>
                        <SelectKeyRenameForm keyData={keyData} onClose={handleCloseEditWalletName} />
                      </Box>
                    ) : (
                      <Flex minWidth={0} alignItems="baseline">
                        <span
                          style={{ display: showEmojiPicker ? 'inline' : 'none', position: 'fixed', zIndex: 10 }}
                          onClick={() => {}}
                        >
                          {showEmojiPicker && (
                            <EmojiAndColorPicker
                              onSelect={(result: any) => {
                                if (isColor(result)) {
                                  setWalletKeyTheme({ ...walletKeyTheme, color: result });
                                } else {
                                  setWalletKeyTheme({ ...walletKeyTheme, emoji: result });
                                }
                                setShowEmojiPicker(false);
                              }}
                              onClickOutside={() => {
                                setShowEmojiPicker(false);
                              }}
                              currentColor={walletKeyTheme.color}
                              currentEmoji={walletKeyTheme.emoji}
                              themeColors={theme.palette.colors}
                              isDark={isDark}
                            />
                          )}
                        </span>
                        <Flex flexDirection="row" minWidth={0}>
                          <Box
                            sx={{
                              backgroundColor:
                                walletKeyTheme.emoji === '' ? theme.palette.colors[walletKeyTheme.color].main : 'none',
                              fontSize: '48px',
                              marginRight: '10px',
                              width: '64px',
                              height: '64px',
                              lineHeight: '67px',
                              textAlign: 'center',
                              borderRadius: '5px',
                              ':hover': {
                                cursor: 'pointer',
                                backgroundColor: theme.palette.colors[walletKeyTheme.color].main,
                              },
                            }}
                            onClick={() => setShowEmojiPicker(true)}
                          >
                            {walletKeyTheme.emoji}
                          </Box>
                          <Flex flexDirection="column" minWidth={0}>
                            <Flex flexDirection="row" sx={{ height: '39px' }}>
                              <Typography variant="h4" display="flex-inline" noWrap>
                                {keyData?.label || <Trans>Wallet</Trans>}
                              </Typography>
                              <IconButton
                                onClick={handleEditWalletName}
                                size="small"
                                data-testid="LayoutDashboard-edit-walletName"
                                sx={{ padding: '8px' }}
                              >
                                <EditIcon color="disabled" />
                              </IconButton>
                            </Flex>
                            {fingerprint && (
                              <Flex flexDirection="row" alignItems="center" gap={0.5}>
                                <StyledInlineTypography
                                  color="textSecondary"
                                  component="span"
                                  data-testid="LayoutDashboard-fingerprint"
                                  sx={{ fontSize: '16px' }}
                                >
                                  &nbsp;
                                  {fingerprint}
                                </StyledInlineTypography>
                              </Flex>
                            )}
                          </Flex>
                        </Flex>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
                <Flex alignItems="center" gap={1} flexGrow={1}>
                  {actions}
                </Flex>
              </Flex>
            </StyledToolbar>
          </StyledAppBar>
          <Flex sx={{ minWidth: 0, flexDirection: 'column', flexGrow: 1, overflow: 'auto' }}>
            <Flex flexDirection="column" gap={2} flexGrow={1} overflow="auto">
              <Suspense fallback={<Loading center />}>{outlet ? <Outlet /> : children}</Suspense>
            </Flex>
          </Flex>
        </Flex>
      </Suspense>
    </Flex>
  );
}
