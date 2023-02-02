import { useCallback } from 'react';

export default function useShowNotification() {
  const handleShowNotification = useCallback((notification: { title?: string; body?: string }) => {
    const { ipcRenderer } = window as any;
    ipcRenderer.invoke('showNotification', notification);
  }, []);

  return handleShowNotification;
}
