import { SyncingStatus } from '@chia-network/api';
import {
  useGetNotificationsQuery,
  useDeleteNotificationsMutation,
  useLazyGetTimestampForHeightQuery,
} from '@chia-network/api-react';
import { ConfirmDialog, useOpenDialog, useAuth } from '@chia-network/core';
import { useWalletState } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import debug from 'debug';
import { orderBy } from 'lodash';
import React, { useEffect, useCallback, useRef } from 'react';

import type Notification from '../@types/Notification';
import NotificationType from '../constants/NotificationType';
import useStateAbort from './useStateAbort';

const log = debug('chia-gui:useNotifications');

type BlockchainNotification = {
  id: string;
  message: string;
  amount: string;
  height: number;
};

export default function useBlockchainNotifications() {
  const {
    data: blockchainNotifications,
    isLoading: isLoadingNotifications,
    error: getNotificationsError,
  } = useGetNotificationsQuery({});

  const [getTimestampForHeight] = useLazyGetTimestampForHeightQuery();

  const { isLoading: isLoggingIn } = useAuth();
  const { state, isLoading: isLoadingWalletState } = useWalletState();

  const [notifications, setNotifications] = useStateAbort<Notification[]>([]);
  const [isPreparingNotifications, setIsPreparingNotifications] = useStateAbort<boolean>(true);
  const [preparingError, setPreparingError] = useStateAbort<Error | undefined>(undefined);

  const abortControllerRef = useRef<AbortController>(new AbortController());

  const [deleteNotifications] = useDeleteNotificationsMutation();
  const openDialog = useOpenDialog();
  const isSynced = state === SyncingStatus.SYNCED;

  const isLoadingServices = !isSynced || isLoadingNotifications || isLoadingWalletState;

  const isLoading = isLoadingServices || isPreparingNotifications;

  const error = getNotificationsError || preparingError;

  // immutable
  const prepareNotifications = useCallback(
    async (
      blockchainNotificationsList: BlockchainNotification[],
      isWalletSynced: boolean,
      loggingIn: boolean,
      abortSignal: AbortSignal
    ) => {
      try {
        setPreparingError(undefined, abortSignal);
        setIsPreparingNotifications(true, abortSignal);

        // without wallet sync we can't get timestamp, during loggingIn we have wrong
        // list of notifications from previous fingerprint and we need to wait for clear cache
        if (!blockchainNotificationsList?.length || !isWalletSynced || loggingIn) {
          setNotifications([], abortSignal);
          return;
        }

        const items = await Promise.all<Notification | null>(
          blockchainNotificationsList.map(async (notification): Promise<Notification | null> => {
            try {
              const { id, message: hexMessage, height } = notification;
              const message = hexMessage ? Buffer.from(hexMessage, 'hex').toString() : '';
              if (!message) {
                throw new Error('Notification has not message');
              }

              const { t: type, d: data } = JSON.parse(message);

              // without wallet sync we can't get timestamp
              const timestampData = await getTimestampForHeight({
                height,
              }).unwrap();

              if (!('timestamp' in timestampData)) {
                throw new Error('No timestamp in response');
              }

              if (type === 1) {
                const { u: url, ph: puzzleHash } = data;

                if (puzzleHash) {
                  return {
                    // type: NotificationType.COUNTER_OFFER,
                    type: NotificationType.OFFER,
                    id,
                    source: 'BLOCKCHAIN',
                    timestamp: timestampData.timestamp,
                    offerURL: url,
                    puzzleHash,
                  };
                }

                return {
                  type: NotificationType.OFFER,
                  id,
                  source: 'BLOCKCHAIN',
                  timestamp: timestampData.timestamp,
                  offerURL: url,
                };
              }

              throw new Error(`Unknown notification type: ${type}`);
            } catch (e) {
              log('Failed to prepare notification', e);
              return null;
            }
          })
        );

        const definedNotifications = items.filter(Boolean) as Notification[];
        const sortedNotifications = orderBy(definedNotifications, ['timestamp'], ['desc']);

        setNotifications(sortedNotifications, abortSignal);
      } catch (e) {
        setPreparingError(e as Error, abortSignal);
      } finally {
        setIsPreparingNotifications(false, abortSignal);
      }
    },
    [
      setPreparingError /* immutable */,
      setIsPreparingNotifications /* immutable */,
      setNotifications /* immutable */,
      getTimestampForHeight /* immutable */,
    ]
  );

  useEffect(() => {
    if (blockchainNotifications) {
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      prepareNotifications(blockchainNotifications, isSynced, isLoggingIn, abortControllerRef.current.signal);
    }
  }, [blockchainNotifications, prepareNotifications, isSynced, isLoggingIn]);

  const handleDeleteNotification = useCallback(
    async (id: string) => {
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
    },
    [deleteNotifications, openDialog]
  );

  return {
    notifications,
    isLoading,
    error,
    deleteNotification: handleDeleteNotification,
  };
}
