import './wdyr.dev'; // must be first
import './polyfill';
import './config/env';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './components/app/App';
import initPrefs from './init-prefs';

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
