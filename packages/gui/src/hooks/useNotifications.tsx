import { SyncingStatus } from '@chia-network/api';
import { useGetNotificationsQuery, usePrefs, useDeleteNotificationsMutation } from '@chia-network/api-react';
import { ConfirmDialog, useOpenDialog } from '@chia-network/core';
import { useWalletState } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import { orderBy } from 'lodash';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import NotificationType from '../constants/NotificationType';
import fetchOffer from '../util/fetchOffer';
import parseNotification from '../util/parseNotification';
import resolveOfferInfo from '../util/resolveOfferInfo';
import useAssetIdName from './useAssetIdName';
import useShowNotification from './useShowNotification';

const log = debug('chia-gui:useNotifications');

type Notification = {
  id: string;
  message: string;
  height: number;
};

export type NotificationDetails = Notification & {
  type: NotificationType;
  metadata: {
    type: NotificationType;
    version: number;
    data: Record<string, any>;
  };
  valid: boolean;
  offered?: {
    assetType: string;
    displayName: string;
    displayAmount: number;
  }[];
  requested?: {
    assetType: string;
    displayName: string;
    displayAmount: number;
  }[];
};

export default function useNotifications() {
  const {
    data: notifications,
    isLoading: isLoadingNotifications,
    error: getNotificationsError,
  } = useGetNotificationsQuery();
  const { state, isLoading: isLoadingWalletState } = useWalletState();
  const [enabled, setEnabled] = usePrefs<number>('notifications', true);
  const [lastPushNotificationHeight, setLastPushNotificationHeight] = usePrefs<string>('lastPushNotificationHeight', 0);
  const [seenHeight, setSeenHeight] = usePrefs<number>('notificationsSeenHeight', 0);
  const [isPreparingNotifications, setIsPreparingNotifications] = useState<boolean>(false);
  const [preparingError, setPreparingError] = useState<Error | undefined>();
  const [preparedNotifications, setPreparedNotifications] = useState<NotificationDetails[]>([]);
  const { lookupByAssetId } = useAssetIdName();
  const [deleteNotifications] = useDeleteNotificationsMutation();
  const showNotification = useShowNotification();
  const openDialog = useOpenDialog();

  const isSynced = state === SyncingStatus.SYNCED;
  const isLoading = isLoadingNotifications || isPreparingNotifications || isLoadingWalletState;
  const error = getNotificationsError || preparingError;

  const prepareNotifications = useCallback(async () => {
    if (!notifications || isPreparingNotifications || !isSynced) {
      return;
    }

    try {
      setIsPreparingNotifications(true);

      const prepared = (
        await Promise.all(
          notifications.map(async (notification) => {
            try {
              const { message: hexMessage } = notification;
              const message = hexMessage ? Buffer.from(hexMessage, 'hex').toString() : '';
              if (!message) {
                throw new Error('Notification has not message');
              }

              const metadata = parseNotification(message);
              const { type } = metadata;

              if ([NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(type)) {
                const {
                  data: { url },
                } = metadata;
                const data = await fetchOffer(url);
                const { valid, offerSummary } = data;
                if (!valid) {
                  return null;
                }

                const offered = resolveOfferInfo(offerSummary, 'offered', lookupByAssetId);
                const requested = resolveOfferInfo(offerSummary, 'requested', lookupByAssetId);

                // todo add limit to 1 NFT per offer

                return {
                  type,
                  metadata,
                  offered,
                  requested,
                  ...data,
                  ...notification,
                };
              }

              throw new Error(`Unknown notification type: ${type}`);
            } catch (e) {
              log('Failed to prepare notification', e);
              return null;
            }
          })
        )
      ).filter(Boolean);

      const sortedNotifications = orderBy(prepared, ['height'], ['desc']);

      setPreparedNotifications(sortedNotifications);
    } catch (e) {
      setPreparingError(e as Error);
    } finally {
      setIsPreparingNotifications(false);
    }
    // TODO: fix dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isPreparingNotifications causes this to run infinitely
  }, [notifications, lookupByAssetId, isSynced]);

  const showPushNotifications = useCallback(() => {
    if (!enabled) {
      return;
    }

    const firstUnseenNotification = preparedNotifications.find(
      (notification) => notification.height > lastPushNotificationHeight
    );

    if (!firstUnseenNotification) {
      return;
    }

    setLastPushNotificationHeight(firstUnseenNotification.height);

    showNotification({
      title: 'New Offer',
      body: 'You have a new offer',
    });
  }, [lastPushNotificationHeight, preparedNotifications, enabled, setLastPushNotificationHeight, showNotification]);

  const unseenCount = useMemo(
    () => preparedNotifications.filter((notification) => notification.height > seenHeight).length,
    [preparedNotifications, seenHeight]
  );

  useEffect(() => {
    prepareNotifications();
  }, [prepareNotifications]);

  useEffect(() => {
    showPushNotifications();
  }, [showPushNotifications]);

  function setAsSeen() {
    const highestHeight = preparedNotifications.reduce((acc, notification) => Math.max(notification.height, acc), 0);
    setSeenHeight(highestHeight);
  }

  async function handleDeleteNotification(id: string) {
    await openDialog(
      <ConfirmDialog
        title={<Trans>Please Confirm</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        confirmColor="danger"
        onConfirm={() =>
          deleteNotifications({
            ids: [id],
          }).unwrap()
        }
      >
        <Trans>Do you want to remove this offer notification? This action cannot be undone.</Trans>
      </ConfirmDialog>
    );
  }

  return {
    notifications: preparedNotifications,
    isLoading,
    error,
    unseenCount,
    setAsSeen,
    deleteNotification: handleDeleteNotification,
    enabled,
    setEnabled,
  };
}
