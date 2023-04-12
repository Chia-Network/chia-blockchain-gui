import React from 'react';

/// <reference types="@welldone-software/why-did-you-render" />
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line global-require -- this is a dev-only import
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    // trackAllPureComponents: true,
  });
}
