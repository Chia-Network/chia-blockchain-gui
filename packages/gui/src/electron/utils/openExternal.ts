import { shell } from 'electron';

import isValidURL from './isValidURL';

export default function openExternal(url: string) {
  if (!isValidURL(url)) {
    return;
  }

  shell.openExternal(url);
}
