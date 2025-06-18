import { useCallback } from 'react';

export default function useShowNotification() {
  const handleShowNotification = useCallback((notification: { title: string; body: string }) => {
    window.appAPI.showNotification(notification);
  }, []);

  return handleShowNotification;
}
