import './polyfill';
import './config/env';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/app/App';

// we need to use additional root for hot reloading
function Root() {
  return <App />;
}

(window as any).ipcRenderer.invoke('readPrefs')
  .then((prefs: Record<string, any>) => {
    (window as any).preferences = prefs;
    ReactDOM.render(<Root />, document.querySelector('#root'));
  })
  .catch((e: unknown) => {
    window.alert(e);
  })
;
