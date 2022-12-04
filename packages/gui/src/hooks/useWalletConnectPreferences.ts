import { useLocalStorage } from '@chia-network/api-react';
import { useCallback } from 'react';

export type WalletConnectPreferences = {
  enabled?: boolean;
  autoConfirm?: boolean;
  allowConfirmationFingerprintChange?: boolean;
};

export default function useWalletConnectPreferences(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  autoConfirm: boolean;
  setAutoConfirm: (enabled: boolean) => void;
  allowConfirmationFingerprintChange: boolean;
  setAllowConfirmationFingerprintChange: (enabled: boolean) => void;
} {
  const [preferences, setPreferences] = useLocalStorage<WalletConnectPreferences>('walletConnectPreferences', {});

  const enabled = preferences?.enabled ?? false;
  const autoConfirm = preferences?.autoConfirm ?? false;
  const allowConfirmationFingerprintChange = preferences?.allowConfirmationFingerprintChange ?? false;

  const setEnabled = useCallback(
    (value: boolean) => {
      setPreferences((currentPreferences: WalletConnectPreferences) => ({
        ...currentPreferences,
        enabled: value,
      }));
    },
    [setPreferences]
  );

  const setAutoConfirm = useCallback(
    (value: boolean) => {
      setPreferences((currentPreferences: WalletConnectPreferences) => ({
        ...currentPreferences,
        autoConfirm: value,
      }));
    },
    [setPreferences]
  );

  const setAllowConfirmationFingerprintChange = useCallback(
    (value: boolean) => {
      setPreferences((currentPreferences: WalletConnectPreferences) => ({
        ...currentPreferences,
        allowConfirmationFingerprintChange: value,
      }));
    },
    [setPreferences]
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
