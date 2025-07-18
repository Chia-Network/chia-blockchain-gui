import isElectron from 'is-electron';
import { useCallback } from 'react';
import isURL from 'validator/es/lib/isURL';

export default function useOpenExternal(): (url: string) => void {
  const handleOpen = useCallback((url: string) => {
    if (!isURL(url, { protocols: ['http', 'https', 'ipfs'], require_protocol: true })) {
      return;
    }

    if (isElectron()) {
      window.linkAPI.openExternal(url);
      return;
    }

    window.open(url, '_blank');
  }, []);

  return handleOpen;
}
