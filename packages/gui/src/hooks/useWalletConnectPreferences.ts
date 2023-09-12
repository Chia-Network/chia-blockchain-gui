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
    [preferences, setPreferences]
  );

  const setAllowConfirmationFingerprintChange = useCallback(
    (value: boolean) => {
      setPreferences((currentPreferences: WalletConnectPreferences) => ({
        ...currentPreferences,
        allowConfirmationFingerprintChange: value,
      }));
    },
    [preferences, setPreferences]
  );

  const setBypassReadonlyCommands = useCallback(
    (value: any) => {
      console.log('in setBypassReadonlyCommands');
      console.log(value);
      console.log('preferences: ');
      console.log(preferences);
      console.log('value: ', value);
      debugger;

      setPreferences((currentPreferences: WalletConnectPreferences) => {
        debugger;
        console.log('in setBypassReadonlyCommands: setPreferences: currentPreferences');
        return {
          ...currentPreferences,
          bypassReadonlyCommands: value,
        };
      });
    },
    [preferences, setPreferences]
  );

  console.log('preferences: ');
  console.log(JSON.stringify(preferences));

  return {
    enabled,
    setEnabled,
    allowConfirmationFingerprintChange,
    setAllowConfirmationFingerprintChange,
    bypassReadonlyCommands,
    setBypassReadonlyCommands,
  };
}
