import { store, api } from '@chia-network/api-react';
import {
  useDarkMode,
  sleep,
  ThemeProvider,
  ModalDialogsProvider,
  ModalDialogs,
  LocaleProvider,
  LayoutLoading,
  dark,
  light,
  ErrorBoundary,
} from '@chia-network/core';
import { nativeTheme } from '@electron/remote';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import isElectron from 'is-electron';
import React, { ReactNode, useEffect, useState, Suspense } from 'react';
import { Provider } from 'react-redux';
import { Outlet } from 'react-router-dom';
import WebSocket from 'ws';

import { i18n, defaultLocale, locales } from '../../config/locales';
import LRUsProvider from '../lrus/LRUsProvider';
import WalletConnectProvider, { WalletConnectChiaProjectId } from '../walletConnect/WalletConnectProvider';
import AppState from './AppState';

async function waitForConfig() {
  while (true) {
    const config = await window.ipcRenderer.invoke('getConfig');
    if (config) {
      return config;
    }

    await sleep(50);
  }
}

type AppProps = {
  outlet?: boolean;
  children?: ReactNode;
};

export default function App(props: AppProps) {
  const { children, outlet } = props;
  const [isReady, setIsReady] = useState<boolean>(false);
  const { isDarkMode } = useDarkMode();

  const theme = isDarkMode ? dark : light;
  if (isElectron()) {
    nativeTheme.themeSource = isDarkMode ? 'dark' : 'light';
  }

  async function init() {
    const config = await waitForConfig();
    const { cert, key, url } = config;

    store.dispatch(
      api.initializeConfig({
        url,
        cert,
        key,
        webSocket: WebSocket,
      })
    );

    setIsReady(true);
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <Provider store={store}>
      <LocaleProvider i18n={i18n} defaultLocale={defaultLocale} locales={locales}>
        <ThemeProvider theme={theme} fonts global>
          <ErrorBoundary>
            <LRUsProvider>
              <ModalDialogsProvider>
                <WalletConnectProvider projectId={WalletConnectChiaProjectId}>
                  {isReady ? (
                    <Suspense fallback={<LayoutLoading />}>
                      <AppState>{outlet ? <Outlet /> : children}</AppState>
                    </Suspense>
                  ) : (
                    <LayoutLoading>
                      <Typography variant="body1">
                        <Trans>Loading configuration</Trans>
                      </Typography>
                    </LayoutLoading>
                  )}
                  <ModalDialogs />
                </WalletConnectProvider>
              </ModalDialogsProvider>
            </LRUsProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </LocaleProvider>
    </Provider>
  );
}
