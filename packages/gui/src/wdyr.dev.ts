import React from 'react';

/// <reference types="@welldone-software/why-did-you-render" />
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
if (isDev) {
  // eslint-disable-next-line global-require -- this is a dev-only import
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    // trackAllPureComponents: true,
  });
}
