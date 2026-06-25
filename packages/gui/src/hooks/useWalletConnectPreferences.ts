import { useLocalStorage } from '@chia-network/api-react';
import { useCallback } from 'react';

export type WalletConnectPreferences = {
  enabled?: boolean;
};

export default function useWalletConnectPreferences(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
  const [preferences, setPreferences] = useLocalStorage<WalletConnectPreferences>('walletConnectPreferences', {});

  const enabled = preferences?.enabled ?? false;

  const setEnabled = useCallback(
    (value: boolean) => {
      setPreferences((currentPreferences: WalletConnectPreferences) => ({
        ...currentPreferences,
        enabled: value,
      }));
    },
    [setPreferences],
  );

  return {
    enabled,
    setEnabled,
  };
}
