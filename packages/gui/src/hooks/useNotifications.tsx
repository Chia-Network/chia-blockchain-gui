import { useGetNotificationsQuery, usePrefs, useDeleteNotificationsMutation } from '@chia-network/api-react';
import { ConfirmDialog, useCurrencyCode, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import { orderBy } from 'lodash';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { parseNotificationOfferData } from '../components/notification/utils';
import NotificationType from '../constants/NotificationType';
import fetchOffer from '../util/fetchOffer';
import resolveOfferInfo from '../util/resolveOfferInfo';
import useAssetIdName from './useAssetIdName';
import useShowNotification from './useShowNotification';

const log = debug('chia-gui:useNotifications');

type Notification = {
  id: string;
  message: string;
  height: number;
};

type NotificationDetails = Notification & {
  type: NotificationType;
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
  const [enabled, setEnabled] = usePrefs<number>('notifications', true);
  const [lastPushNotificationHeight, setLastPushNotificationHeight] = usePrefs<string>('lastPushNotificationHeight', 0);
  const [seenHeight, setSeenHeight] = usePrefs<number>('notificationsSeenHeight', 0);
  const [isPreparingNotifications, setIsPreparingNotifications] = useState<boolean>(true);
  const [preparingError, setPreparingError] = useState<Error | undefined>();
  const [preparedNotifications, setPreparedNotifications] = useState<NotificationDetails[]>([]);
  const { lookupByAssetId } = useAssetIdName();
  const [deleteNotifications] = useDeleteNotificationsMutation();
  const showNotification = useShowNotification();
  const openDialog = useOpenDialog();
  const currencyCode = useCurrencyCode() ?? 'xch';

  const isLoading = isLoadingNotifications || isPreparingNotifications;
  const error = getNotificationsError || preparingError;

  const prepareNotifications = useCallback(async () => {
    if (!notifications || !isPreparingNotifications) {
      return;
    }

    try {
      setIsPreparingNotifications(true);

      if (!notifications) {
        return;
      }

      const prepared = (
        await Promise.all(
          notifications.map(async (notification) => {
            const { message: hexMessage } = notification;
            const message = Buffer.from(hexMessage ?? '', 'hex').toString('utf8');

            console.log('message:');
            console.log(message);
            if (!message) {
              log('Notification has no message', notification);
              return null;
            }

            const { u: offerURLString, ph: senderPuzzleHash } = parseNotificationOfferData(message) ?? {};

            console.log('offerURLString:');
            console.log(offerURLString);
            console.log('senderPuzzleHash:');
            console.log(senderPuzzleHash);

            try {
              const offerURL = new URL(offerURLString ?? '');
              const pathComponents = offerURL.pathname.split('/');
              const offerId = pathComponents[pathComponents.length - 1];
              let resolvedOfferURL = offerURLString;

              if (offerURL.host.endsWith('spacescan.io')) {
                resolvedOfferURL = `https://api2.spacescan.io/api/offer/${offerId}?coin=${currencyCode}&version=1`;
              } else if (offerURL.host.endsWith('dexie.space')) {
                resolvedOfferURL = `https://${offerURL.host}/v1/offers/${offerId}`;
              }

              console.log('resolvedOfferURL:');
              console.log(resolvedOfferURL);

              const data = await fetchOffer(resolvedOfferURL);
              const { offerSummary } = data;

              const offered = resolveOfferInfo(offerSummary, 'offered', lookupByAssetId);
              const requested = resolveOfferInfo(offerSummary, 'requested', lookupByAssetId);

              console.log('offered:');
              console.log(offered);

              console.log('requested:');
              console.log(requested);
              return {
                type: NotificationType.OFFER,
                offered,
                requested,
                ...data,
                ...notification,
              };
            } catch (e) {
              console.error(e);
              log('Failed to prepare notification', e);
              return null;
            }
          })
        )
      ).filter((notification) => {
        if (!notification) {
          return false;
        }

        console.log('notification:');
        console.log(notification);
        if (notification.type === NotificationType.OFFER) {
          // return !!notification.valid;
          return true;
        }

        return true;
      });

      console.log('prepared:');
      console.log(prepared);
      const sortedNotifications = orderBy(prepared, ['height'], ['desc']);

      console.log('sortedNotifications:');
      console.log(sortedNotifications);
      setPreparedNotifications(sortedNotifications);
    } catch (e) {
      setPreparingError(e as Error);
    } finally {
      setIsPreparingNotifications(false);
    }
  }, [notifications, lookupByAssetId, isPreparingNotifications]);

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
