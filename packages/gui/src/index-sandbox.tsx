import './polyfill';
import './main.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import AppSandbox from './components/app/AppSandbox';

const container = document.querySelector('#root');
const root = createRoot(container!);

root.render(<AppSandbox />);
