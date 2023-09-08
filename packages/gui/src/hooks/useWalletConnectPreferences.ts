import { useLocalStorage } from '@chia-network/api-react';
import { useCallback } from 'react';

export type WalletConnectPreferences = {
  enabled?: boolean;
  allowConfirmationFingerprintChange?: boolean;
  bypassReadonlyCommands: any;
};

export default function useWalletConnectPreferences(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  allowConfirmationFingerprintChange: boolean;
  setAllowConfirmationFingerprintChange: (enabled: boolean) => void;
  bypassReadonlyCommands: any;
  setBypassReadonlyCommands: (obj: any) => void;
} {
  const [preferences, setPreferences] = useLocalStorage<WalletConnectPreferences>('walletConnectPreferences', {});

  const enabled = preferences?.enabled ?? false;
  const allowConfirmationFingerprintChange = preferences?.allowConfirmationFingerprintChange ?? false;

  const bypassReadonlyCommands = preferences?.bypassReadonlyCommands ?? {};
  const setEnabled = useCallback(
    (value: boolean) => {
      setPreferences((currentPreferences: WalletConnectPreferences) => ({
        ...currentPreferences,
        enabled: value,
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

  const setBypassReadonlyCommands = useCallback(
    (value: any) => {
      setPreferences((currentPreferences: WalletConnectPreferences) => ({
        ...currentPreferences,
        bypassReadonlyCommands: value,
      }));
    },
    [setPreferences]
  );

  return {
    enabled,
    setEnabled,
    allowConfirmationFingerprintChange,
    setAllowConfirmationFingerprintChange,
    bypassReadonlyCommands,
    setBypassReadonlyCommands,
  };
}
