import { useCallback } from 'react';
import { useLocalStorage } from '@chia/api-react';

type Prefs = {
  enabled?: boolean;
  autoConfirm?: boolean;
};

export default function useWalletConnectPrefs(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  autoConfirm: boolean;
  setAutoConfirm: (autoConfirm: boolean) => void;
} {
  const [prefs, setPrefs] = useLocalStorage<Prefs>('walletConnectPrefs', {});

  const enabled = prefs?.enabled ?? false;
  const autoConfirm = prefs?.autoConfirm ?? false;

  const setEnabled = useCallback(
    (enabled: boolean) => {
      setPrefs((prefs: Prefs) => ({
        ...prefs,
        enabled,
      }));
    },
    [setPrefs],
  );

  const setAutoConfirm = useCallback(
    (autoConfirm: boolean) => {
      setPrefs((prefs: Prefs) => ({
        ...prefs,
        autoConfirm,
      }));
    },
    [setPrefs],
  );

  return {
    enabled,
    setEnabled,
    autoConfirm,
    setAutoConfirm,
  };
}
