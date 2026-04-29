import './wdyr.dev'; // must be first
import './polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './components/app/App';
import initPrefs from './init-prefs';

// The WalletConnect SDK can reject internal promises with "No matching key"
// during benign stale-pairing races (e.g. reconnecting after storage cleanup)
// from async paths outside our try/catch sites, producing noisy errors in
// DevTools. Suppress those specific rejections but leave a visible breadcrumb
// so they are not completely silent, and scope the suppression to
// WalletConnect-originated errors so unrelated code paths are not swallowed.
window.addEventListener('unhandledrejection', (event) => {
  const { reason } = event;
  const message = reason?.message ?? String(reason);
  const stack: string = reason?.stack ?? '';

  if (!message.includes('No matching key')) {
    return;
  }

  const isWalletConnectOrigin = /walletconnect/i.test(stack);
  if (!isWalletConnectOrigin) {
    console.warn('[chia-gui] "No matching key" rejection from non-WalletConnect origin; not suppressing:', reason);
    return;
  }

  console.info('[chia-gui] Suppressing WalletConnect stale-key rejection:', message);
  event.preventDefault();
});

// we need to use additional root for hot reloading
function Root() {
  return <App />;
}

const onInit = () => {
  const container = document.querySelector('#root');
  const root = createRoot(container!);
  root.render(<Root />);
};

initPrefs(onInit).catch(() => {
  // window.alert(e);
});
