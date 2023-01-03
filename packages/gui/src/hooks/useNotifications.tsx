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
    notifications: [{ id: 1, message: 'https://storage.googleapis.com/chia-offers/_test_offer_nft' }],
    isLoading,
    error,
    unseenCount,
    setAsSeen,
  };
}
