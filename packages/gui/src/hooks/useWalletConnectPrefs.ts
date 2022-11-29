import { useCallback } from 'react';
import { useLocalStorage } from '@chia/api-react';

type Preferences = {
  enabled?: boolean;
  autoConfirm?: boolean;
  allowConfirmationFingerprintChange?: boolean;
};

export default function useWalletConnectPrefs(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  autoConfirm: boolean;
  setAutoConfirm: (enabled: boolean) => void;
  allowConfirmationFingerprintChange: boolean;
  setAllowConfirmationFingerprintChange: (enabled: boolean) => void;
} {
  const [prefs, setPrefs] = useLocalStorage<Preferences>(
    'walletConnectPrefs',
    {},
  );

  const enabled = prefs?.enabled ?? false;
  const autoConfirm = prefs?.autoConfirm ?? false;
  const allowConfirmationFingerprintChange =
    prefs?.allowConfirmationFingerprintChange ?? false;

  const setEnabled = useCallback(
    (enabled: boolean) => {
      setPrefs((prefs: Preferences) => ({
        ...prefs,
        enabled,
      }));
    },
    [setPrefs],
  );

  const setAutoConfirm = useCallback(
    (autoConfirm: boolean) => {
      setPrefs((prefs: Preferences) => ({
        ...prefs,
        autoConfirm,
      }));
    },
    [setPrefs],
  );

  const setAllowConfirmationFingerprintChange = useCallback(
    (allowConfirmationFingerprintChange: boolean) => {
      setPrefs((prefs: Preferences) => ({
        ...prefs,
        allowConfirmationFingerprintChange,
      }));
    },
    [setPrefs],
  );

  return {
    enabled,
    setEnabled,
    autoConfirm,
    setAutoConfirm,
    allowConfirmationFingerprintChange,
    setAllowConfirmationFingerprintChange,
  };
}
