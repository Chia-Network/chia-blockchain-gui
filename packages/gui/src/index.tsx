import './wdyr.dev'; // must be first
import './polyfill';
import './config/env';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/app/App';
import initPrefs from './init-prefs';

// we need to use additional root for hot reloading
function Root() {
  return <App />;
}

const onInit = () => {
  ReactDOM.render(<Root />, document.querySelector('#root'));
};
initPrefs(onInit).catch(() => {
  // window.alert(e);
});
