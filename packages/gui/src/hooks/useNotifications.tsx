import { useGetNotificationsQuery } from '@chia/api-react';
import { useState } from 'react';

export default function useNotifications() {
  const { data: notifications, isLoading, error } = useGetNotificationsQuery();
  const [unseenCount, setUnseenCount] = useState(2);

  console.log('notifications', notifications, isLoading, error);

  function setAsSeen() {
    setUnseenCount(0);
  }

  return {
    notifications,
    isLoading,
    error,
    unseenCount,
    setAsSeen,
  };
}
