import {
  useGetLoggedInFingerprintQuery,
  useCurrentFingerprintSettings,
  useLocalStorage,
} from '@chia-network/api-react';
import { orderBy } from 'lodash';
import React, { useMemo, useEffect, useCallback, createContext, type ReactNode } from 'react';

import type Notification from '../../@types/Notification';
import useBlockchainNotifications from '../../hooks/useBlockchainNotifications';
import useNotificationSettings from '../../hooks/useNotificationSettings';
import useShowNotification from '../../hooks/useShowNotification';
import { pushNotificationStringsForNotificationType } from './utils';

const MAX_NOTIFICATIONS = 500;

export const NotificationsContext = createContext<
  | {
      notifications: Notification[];
      isLoading: boolean;
      error?: Error;

      unseenCount: number;
      setAsSeen: () => void;

      areNotificationsEnabled: boolean;
      setNotificationsEnabled: (enabled: boolean) => void;
      pushNotificationsEnabled: boolean;
      setPushNotificationsEnabled: (enabled: boolean) => void;

      showNotification: (notification: Notification) => void;
      deleteNotification: (notificationId: string) => void;
    }
  | undefined
>(undefined);

export type NotificationsProviderProps = {
  children: ReactNode;
};

export default function NotificationsProvider(props: NotificationsProviderProps) {
  const { children } = props;

  const {
    data: currentFingerprint,
    isLoading: isLoadingLoggedInFingerprint,
    error: errorLoggedInFingerprint,
  } = useGetLoggedInFingerprintQuery();

  const {
    notifications: blockchainNotifications,
    isLoading: isLoadingBlockchainNotifications,
    error: errorBlockchainNotifications,
    deleteNotification,
  } = useBlockchainNotifications();

  const showPushNotification = useShowNotification();

  // list of all triggered notifications except backend notifications
  const [triggeredNotifications, setTriggeredNotifications] = useLocalStorage<Notification[]>('localNotifications', []);

  const {
    globalNotifications,
    setGlobalNotifications,

    pushNotifications,
    setPushNotifications,
  } = useNotificationSettings();

  const [, setLastPushNotificationTimestamp, { isLoading: isLoadingPushNotificationsTimestamp, fingerprint }] =
    useCurrentFingerprintSettings<number>('lastPushNotificationTimestamp', 0);

  // state for visible badge
  const [seenAt, setSeenAt, { isLoading: isLoadingSeenHeight }] = useCurrentFingerprintSettings<number>(
    'notificationsSeenAt',
    0
  );

  const isLoadingServices = isLoadingLoggedInFingerprint || isLoadingPushNotificationsTimestamp || isLoadingSeenHeight;

  // local can work without blockchain notifications
  const isLoading = isLoadingServices || isLoadingBlockchainNotifications;

  const error = (errorLoggedInFingerprint as Error | undefined) || errorBlockchainNotifications;

  // immutable
  const showNotification = useCallback(
    (notification: Notification) => {
      setTriggeredNotifications((prev = []) => [...prev, notification].slice(-MAX_NOTIFICATIONS));
    },
    [setTriggeredNotifications /* immutable */]
  );

  const triggeredNotificationsByCurrentFingerprint = useMemo(() => {
    const list: Notification[] = [];

    triggeredNotifications?.forEach((notification) => {
      const { fingerprints } = notification;
      if (fingerprints && (!currentFingerprint || !fingerprints.includes(currentFingerprint))) {
        return;
      }

      list.push(notification);
    });

    return list;
  }, [triggeredNotifications, currentFingerprint]);

  const notifications = useMemo(() => {
    // only show blockchain notifications when synced otherwise it will be not able to download notification state
    const list: Notification[] = [...blockchainNotifications, ...triggeredNotificationsByCurrentFingerprint];

    return orderBy(list, ['timestamp'], ['desc']);
  }, [triggeredNotificationsByCurrentFingerprint, blockchainNotifications]);

  const showPushNotifications = useCallback(() => {
    // if fingerprint is not set then we can't show push notifications (user is not logged in)
    if (!globalNotifications || !pushNotifications || isLoadingServices || !fingerprint) {
      return;
    }

    setLastPushNotificationTimestamp((prevLastPushNotificationTimestamp = 0) => {
      const firstUnseenNotification = notifications.find(
        (notification) => notification.timestamp > prevLastPushNotificationTimestamp
      );

      if (!firstUnseenNotification) {
        return prevLastPushNotificationTimestamp;
      }

      const { title, body } = pushNotificationStringsForNotificationType(firstUnseenNotification);

      showPushNotification({
        title,
        body,
      });

      return firstUnseenNotification.timestamp;
    });
  }, [
    globalNotifications,
    pushNotifications,
    isLoadingServices,
    setLastPushNotificationTimestamp,
    notifications,
    showPushNotification,
    fingerprint,
  ]);

  const unseenCount = useMemo(
    () =>
      seenAt ? notifications.filter((notification) => notification.timestamp > seenAt).length : notifications.length,
    [seenAt, notifications]
  );

  const setAsSeen = useCallback(() => {
    const [firstNotification] = notifications;
    if (firstNotification) {
      const { timestamp } = firstNotification;
      setSeenAt((prevSeenAt: number = 0) => Math.max(prevSeenAt, timestamp));
    }
  }, [setSeenAt, notifications]);

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      let deleted = false;

      setTriggeredNotifications((prev = []) => {
        const index = prev.findIndex((notification) => notification.id === notificationId);
        if (index !== -1) {
          deleted = true;
          return [...prev.slice(0, index), ...prev.slice(index + 1)];
        }

        return prev;
      });

      if (!deleted) {
        await deleteNotification(notificationId);
      }
    },
    [setTriggeredNotifications, deleteNotification]
  );

  useEffect(() => {
    showPushNotifications();
  }, [showPushNotifications]);

  const contextValue = useMemo(
    () => ({
      // base state
      notifications,
      isLoading,
      error,
      // seen
      unseenCount,
      setAsSeen,
      // settings
      areNotificationsEnabled: globalNotifications,
      setNotificationsEnabled: setGlobalNotifications,
      pushNotificationsEnabled: pushNotifications,
      setPushNotificationsEnabled: setPushNotifications,

      showNotification,
      deleteNotification: handleDeleteNotification,
    }),
    [
      notifications,
      isLoading,
      error,

      unseenCount,
      setAsSeen,

      globalNotifications,
      setGlobalNotifications,
      pushNotifications,
      setPushNotifications,

      showNotification,
      handleDeleteNotification,
    ]
  );

  return <NotificationsContext.Provider value={contextValue}>{children}</NotificationsContext.Provider>;
}
