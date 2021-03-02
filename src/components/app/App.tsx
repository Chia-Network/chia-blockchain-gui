import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { I18nProvider } from '@lingui/react';
import useDarkMode from 'use-dark-mode';
import isElectron from 'is-electron';
import { ConnectedRouter } from 'connected-react-router';
import { ThemeProvider } from '@chia/core';
import AppRouter from './AppRouter';
import darkTheme from '../../theme/dark';
import lightTheme from '../../theme/light';
import WebSocketConnection from '../../hocs/WebsocketConnection';
import store, { history } from '../../modules/store';
import { exit_and_close } from '../../modules/message';
import useLocale from '../../hooks/useLocale';
import './App.css';
import AppModalDialogs from './AppModalDialogs';
import AppLoading from './AppLoading';
import i18n from '../../config/locales';

export default function App() {
  const { value: darkMode } = useDarkMode();
  const [locale] = useLocale('en');

  // get the daemon's uri from global storage (put there by loadConfig)
  let daemon_uri = null;
  if (isElectron()) {
    const electron = window.require('electron');
    const { remote : r } = electron;
    daemon_uri = r.getGlobal('daemon_rpc_ws');
  }

  useEffect(() => {
    i18n.activate(locale);
    // @ts-ignore
    window.ipcRenderer.send("set-locale", locale)
  }, [locale]);

  useEffect(() => {
    window.addEventListener('load', () => {
      if (isElectron()) {
        // @ts-ignore
        window.ipcRenderer.on('exit-daemon', (event) => {
          store.dispatch(exit_and_close(event));
        });
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <I18nProvider i18n={i18n}>
          <WebSocketConnection host={daemon_uri}>
            <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
              <AppRouter />
              <AppModalDialogs />
              <AppLoading />
            </ThemeProvider>
          </WebSocketConnection>
        </I18nProvider>
      </ConnectedRouter>
    </Provider>
  );
}
