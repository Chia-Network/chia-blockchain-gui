import { useHotkeys } from 'react-hotkeys-hook';

import { isMac } from '../util/utils';

export type PasteParams = {
  callback: (pastedText: string) => void;
};

export default function usePaste(params: PasteParams) {
  const { callback } = params;
  const hotKey = isMac() ? 'cmd+v' : 'ctrl+v';

  useHotkeys(hotKey, () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        callback(text);
      })
      .catch((err) => {
        console.error('Error during paste from clipboard', err);
      });
  });
}
