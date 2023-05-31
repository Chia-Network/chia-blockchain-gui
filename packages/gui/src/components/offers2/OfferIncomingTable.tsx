import { toBech32m } from '@chia-network/api';
import {
  Card,
  Flex,
  Table,
  LoadingOverlay,
  Button,
  useShowError,
  Tooltip,
  useCurrencyCode,
  useOpenDialog,
  ConfirmDialog,
} from '@chia-network/core';
import { Offers as OffersIcon } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React, { useMemo, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import type Notification from '../../@types/Notification';
import NotificationType from '../../constants/NotificationType';
import useOffers from '../../hooks/useOffers';
import useValidNotifications from '../../hooks/useValidNotifications';
import { launcherIdFromNFTId } from '../../util/nfts';
import offerToOfferBuilderData from '../../util/offerToOfferBuilderData';
import HumanTimestamp from '../helpers/HumanTimestamp';
import NotificationPreview from '../notification/NotificationPreview';
import OfferDetails from './OfferDetails';

const cols = [
  {
    field: (notification: Notification) => {
      const offerURLOrData =
        'offerURL' in notification
          ? notification.offerURL
          : 'offerData' in notification
          ? notification.offerData
          : undefined;

      return (
        <Flex gap={1} alignItems="center">
          <div style={{ width: '40px' }}>
            <NotificationPreview
              notification={notification}
              fallback={<OffersIcon sx={{ fontSize: 32 }} />}
              requested
            />
          </div>
          <Flex flexDirection="column">{offerURLOrData && <OfferDetails id={offerURLOrData} requested />}</Flex>
        </Flex>
      );
    },
    minWidth: '160px',
    title: <Trans>Requesting</Trans>,
  },
  {
    field: (notification: Notification) => {
      const offerURLOrData =
        'offerURL' in notification
          ? notification.offerURL
          : 'offerData' in notification
          ? notification.offerData
          : undefined;

      return (
        <Flex gap={1} alignItems="center">
          <div style={{ width: '40px' }}>
            <NotificationPreview notification={notification} fallback={<OffersIcon sx={{ fontSize: 32 }} />} />
          </div>
          <Flex flexDirection="column">{offerURLOrData && <OfferDetails id={offerURLOrData} />}</Flex>
        </Flex>
      );
    },
    title: <Trans>Offering</Trans>,
  },
  {
    field: (notification: Notification) => <HumanTimestamp value={notification.timestamp} />,
    title: <Trans>Creation Date</Trans>,
  },
  {
    field: (notification: Notification, { deleteNotification, showOffer, counterOffer }) => {
      const puzzleHash = 'puzzleHash' in notification ? notification.puzzleHash : undefined;

      async function handleDelete() {
        await deleteNotification(notification);
      }

      function handleShowOffer() {
        showOffer(notification);
      }

      async function handleCounter() {
        await counterOffer(notification);
      }

      const tooltipTitle = puzzleHash ? '' : <Trans>The offer creator has chosen not to allow counter offers</Trans>;

      return (
        <Flex gap={1}>
          <Button variant="outlined" color="primary" onClick={handleShowOffer}>
            <Trans>View</Trans>
          </Button>
          <Tooltip title={tooltipTitle}>
            <span>
              <Button variant="outlined" color="primary" onClick={handleCounter} disabled={!puzzleHash}>
                <Trans>Counter</Trans>
              </Button>
            </span>
          </Tooltip>
          <Button variant="outlined" color="primary" onClick={handleDelete}>
            <Trans>Delete</Trans>
          </Button>
        </Flex>
      );
    },
    minWidth: '200px',
    title: <Trans>Actions</Trans>,
  },
];

export type OfferIncomingTableProps = {
  nftId?: string;
  title?: ReactNode;
};

export default function OfferIncomingTable(props: OfferIncomingTableProps) {
  const { nftId, title = <Trans>Incoming Offers</Trans> } = props;
  const { notifications = [], isLoading, deleteNotification } = useValidNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const openDialog = useOpenDialog();
  const currencyCode = useCurrencyCode();
  const showError = useShowError();
  const { getOffer } = useOffers();

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (![NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(notification.type)) {
          return false;
        }

        if (!nftId) {
          return true;
        }

        const offerId =
          'offerURL' in notification
            ? notification.offerURL
            : 'offerData' in notification
            ? notification.offerData
            : undefined;
        const offerState = getOffer(offerId);
        if (!offerState) {
          return false;
        }

        const offerSummary = offerState.offer?.summary;
        if (!offerSummary) {
          return false;
        }

        const { requested } = offerSummary;
        const launcherId = launcherIdFromNFTId(nftId);
        if (launcherId && requested && launcherId in requested) {
          return true;
        }

        return false;
      }),
    [notifications, nftId, getOffer]
  );

  async function handleCounterOffer(notification: Notification) {
    try {
      const puzzleHash = 'puzzleHash' in notification ? notification.puzzleHash : undefined;
      const offerId =
        'offerURL' in notification
          ? notification.offerURL
          : 'offerData' in notification
          ? notification.offerData
          : undefined;
      const offerState = getOffer(offerId);

      if (!offerState || !puzzleHash || !currencyCode) {
        return;
      }

      const address = currencyCode && puzzleHash ? toBech32m(puzzleHash, currencyCode.toLowerCase()) : '';
      const offerSummary = offerState.offer?.summary;

      const offer = offerToOfferBuilderData(offerSummary);

      navigate('/dashboard/offers/builder', {
        state: {
          referrerPath: location.pathname,
          isCounterOffer: true,
          address,
          offer,
        },
      });
    } catch (e) {
      showError(e);
    }
  }

  async function handleDeleteNotification(notification: Notification) {
    try {
      const canProcess = await openDialog(
        <ConfirmDialog title={<Trans>Confirmation</Trans>} confirmTitle={<Trans>Yes</Trans>} confirmColor="primary">
          <Trans>
            Are you sure you'd like to remove this offer? Please remember that this action is not reversible.
          </Trans>
        </ConfirmDialog>
      );

      if (canProcess) {
        await deleteNotification(notification.id);
      }
    } catch (e) {
      showError(e);
    }
  }

  function handleShowOffer(notification: Notification) {
    const puzzleHash = 'puzzleHash' in notification ? notification.puzzleHash : undefined;
    const offerId =
      'offerURL' in notification
        ? notification.offerURL
        : 'offerData' in notification
        ? notification.offerData
        : undefined;
    const offerState = getOffer(offerId);

    if (!offerState) {
      return;
    }

    const canCounterOffer = puzzleHash && puzzleHash.length > 0;
    const offerData = offerState.offer?.data;
    const offerSummary = offerState.offer?.summary;

    navigate('/dashboard/offers/view', {
      state: {
        referrerPath: location.pathname,
        offerData,
        offerSummary,
        imported: true,
        canCounterOffer,
        address: puzzleHash,
      },
    });
  }

  const hasNotifications = !!filteredNotifications?.length;

  return (
    <Card title={title} titleVariant="h6" transparent>
      <LoadingOverlay loading={isLoading}>
        <Table
          rows={filteredNotifications}
          cols={cols}
          rowsPerPageOptions={[5, 25, 100]}
          rowsPerPage={5}
          pages={hasNotifications}
          isLoading={isLoading}
          metadata={{
            deleteNotification: handleDeleteNotification,
            showOffer: handleShowOffer,
            counterOffer: handleCounterOffer,
          }}
          caption={
            !hasNotifications &&
            !isLoading && (
              <Typography variant="body2" align="center">
                <Trans>No incoming offers</Trans>
              </Typography>
            )
          }
        />
      </LoadingOverlay>
    </Card>
  );
}
