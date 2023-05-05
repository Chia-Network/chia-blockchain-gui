import { useLocalStorage } from '@chia-network/api-react';
import { useState, useEffect } from 'react';

export default function useAppVersion() {
  const [version, setVersion] = useState<string | undefined>(undefined);
  const [appVersionOverride] = useLocalStorage<string>('appVersionOverride', '');

  async function getVersion() {
    const currentVersion = await window.ipcRenderer.invoke('getVersion');
    setVersion(currentVersion);
  }

  useEffect(() => {
    getVersion();
  }, []);

  return {
    version: appVersionOverride || version,
    isLoading: version === undefined,
  };
}
