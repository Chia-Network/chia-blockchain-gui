import { useContext } from 'react';

import { NotificationsContext } from '../components/notification/NotificationsProvider';

export default function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}
