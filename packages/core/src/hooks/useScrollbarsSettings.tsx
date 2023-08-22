import { usePrefs } from '@chia-network/api-react';
import { useCallback } from 'react';

type AutoHide = false | 'leave' | 'scroll';

type ScrollbarsSettings = {
  autoHide: AutoHide;
};

export default function useScrollbarsSettings(): ScrollbarsSettings & {
  setAutoHide: (autoHide: AutoHide) => void;
} {
  const [settings, setSettings] = usePrefs<Partial<ScrollbarsSettings>>('scrollbars', {});

  const setAutoHide = useCallback(
    (autoHide: AutoHide) => {
      setSettings((currentSettings) => ({
        ...currentSettings,
        autoHide,
      }));
    },
    [setSettings]
  );

  return {
    autoHide: settings?.autoHide ?? 'leave',
    setAutoHide,
  };
}
