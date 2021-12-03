import React, { useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { I18nProvider } from '@lingui/react';
import useDarkMode from 'use-dark-mode';
import { createHashHistory } from 'history';
import { MemoryRouter } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import { Loading, ThemeProvider, ModalDialogsProvider, ModalDialogs } from '@chia/core';
import { store, api } from '@chia/api-react';
import { Wallet, ServiceName } from '@chia/api';
import { Trans } from '@lingui/macro';
import LayoutHero from '../layout/LayoutHero';
import AppRouter from './AppRouter';
import darkTheme from '../../theme/dark';
import lightTheme from '../../theme/light';
import useLocale from '../../hooks/useLocale';
import {
  i18n,
  activateLocale,
  defaultLocale,
  getMaterialLocale,
} from '../../config/locales';
import Fonts from './fonts/Fonts';
import AppState from './AppState';

export const history = createHashHistory();

const GlobalStyle = createGlobalStyle`
  html,
  body,
  #root {
    height: 100%;
  }

  #root {
    display: flex;
    flex-direction: column;
  }

  ul .MuiBox-root {
    outline: none;
  }
`;

async function waitForConfig() {
  const { remote } = window.require('electron');

  let keyPath = null;

  while(true) {
    keyPath = remote.getGlobal('key_path');
    if (keyPath) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
}

export default function App() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const { value: darkMode } = useDarkMode();
  const [locale] = useLocale(defaultLocale);

  const theme = useMemo(() => {
    const material = getMaterialLocale(locale);
    return darkMode ? darkTheme(material) : lightTheme(material);
  }, [locale, darkMode]);

  useEffect(() => {
    activateLocale(locale);
  }, [locale]);

  const { api: { config } } = store.getState();
  
  useEffect(async () => {
    if (config) {
      setIsReady(true);
      return;
    }

    await waitForConfig();

    const { remote } = window.require('electron');
    const fs = remote.require('fs');
    const WS = window.require('ws');

    const keyPath = remote.getGlobal('key_path');
    const certPath = remote.getGlobal('cert_path');
    const url = remote.getGlobal('daemon_rpc_ws');

    store.dispatch(api.initializeConfig({
      url,
      cert: fs.readFileSync(certPath).toString(),
      key: fs.readFileSync(keyPath).toString(),
      webSocket: WS,
      services: [ServiceName.WALLET],
    }));

    setIsReady(true);
  }, [config]);

  return (
    <Provider store={store}>
      <MemoryRouter history={history}>
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <GlobalStyle />
            <Fonts />
            {isReady ? (
              <AppState>
                <ModalDialogsProvider>
                  <AppRouter />
                  <ModalDialogs />
                </ModalDialogsProvider>
              </AppState>
            ) : (
              <LayoutHero>
                <Loading center>
                  <Trans>Loading configuration</Trans>
                </Loading>
              </LayoutHero>
            )}
          </ThemeProvider>
        </I18nProvider>
      </MemoryRouter>
    </Provider>
  );
}
