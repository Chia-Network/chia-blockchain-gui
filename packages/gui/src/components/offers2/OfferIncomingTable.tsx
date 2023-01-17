import { Card, Flex, Table, LoadingOverlay, Button, useShowError } from '@chia/core';
import { Offers as OffersIcon } from '@chia/icons';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React, { useMemo, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import NotificationType from '../../constants/NotificationType';
import useAcceptOfferHook from '../../hooks/useAcceptOfferHook';
import useNotifications from '../../hooks/useNotifications';
import NotificationNFTTitle from '../notification/NotificationNFTTitle';
import NotificationPreview from '../notification/NotificationPreview';
import OfferAsset from '../offers/OfferAsset';

const cols = [
  {
    field: (notification: NotificationDetails) => {
      const { requested: resolvedOfferInfo, offer } = notification;

      return (
        <Flex gap={1} alignItems="center">
          <div style={{ width: '40px' }}>
            <NotificationPreview offer={offer} fallback={<OffersIcon sx={{ fontSize: 32 }} />} />
          </div>
          <Flex flexDirection="column">
            {resolvedOfferInfo.map((info, index) => (
              <Flex flexDirection="row" gap={0.5} key={`${index}-${info.displayName}`}>
                {info.assetType === OfferAsset.NFT ? (
                  <NotificationNFTTitle nftId={info.displayName} />
                ) : (
                  <Typography variant="body2" noWrap>
                    {(info.displayAmount as any).toString()} {info.displayName}
                  </Typography>
                )}
              </Flex>
            ))}
          </Flex>
        </Flex>
      );
    },
    minWidth: '160px',
    title: <Trans>Requesting</Trans>,
  },
  {
    field: (notification: NotificationDetails) => {
      const { offered: resolvedOfferInfo } = notification;
      return resolvedOfferInfo.map((info, index) => (
        <Flex flexDirection="row" gap={0.5} key={`${index}-${info.displayName}`}>
          {info.assetType === OfferAsset.NFT ? (
            <NotificationNFTTitle nftId={info.displayName} />
          ) : (
            <Typography variant="body2" noWrap>
              {(info.displayAmount as any).toString()} {info.displayName}
            </Typography>
          )}
        </Flex>
      ));
    },
    title: <Trans>Offering</Trans>,
  },
  {
    field: 'height',
    title: <Trans>Creation Height</Trans>,
  },
  {
    field: (notification: NotificationDetails, { acceptOffer, deleteNotification, showOffer }) => {
      const { id } = notification;

      async function handleAcceptOffer() {
        await acceptOffer(id);
      }

      async function handleDelete() {
        await deleteNotification(id);
      }

      function handleShowOffer() {
        showOffer(id);
      }

      return (
        <Flex gap={1}>
          <Button variant="outlined" color="primary" onClick={handleAcceptOffer}>
            <Trans>Accept</Trans>
          </Button>
          {/*
          <Button variant="outlined" color="primary" onClick={handleShowOffer}>
            <Trans>Counter</Trans>
          </Button>
          {/*
          <Button variant="outlined" color="primary">
            <Trans>Decline</Trans>
          </Button>
          */}
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
  const { notifications = [], isLoading, deleteNotification } = useNotifications();
  const [acceptOffer] = useAcceptOfferHook();
  const navigate = useNavigate();
  const location = useLocation();
  const showError = useShowError();

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (notification.type !== NotificationType.OFFER) {
          return false;
        }

        if (!nftId) {
          return true;
        }

        const { requested = [] } = notification;
        const nft = requested.find((info) => info.assetType === 'NFT' && info.displayName === nftId);

        return !!nft;
      }),
    [notifications, nftId]
  );

  async function handleAcceptOffer(id: string, feeAmount = '0') {
    try {
      const { offerData, offerSummary } = filteredNotifications.find((notification) => notification.id === id);
      await acceptOffer(offerData, offerSummary, feeAmount);
    } catch (e) {
      showError(e);
    }
  }

  async function handleDeleteNotification(id: string) {
    try {
      await deleteNotification(id);
    } catch (e) {
      showError(e);
    }
  }

  function handleShowOffer(id: string) {
    const { offerData, offerSummary } = filteredNotifications.find((notification) => notification.id === id);
    navigate('/dashboard/offers/view', {
      state: {
        referrerPath: location.pathname,
        offerData,
        offerSummary,
        imported: true,
      },
    });
  }

  const hasOffers = !!filteredNotifications?.length;

  return (
    <Card title={title} titleVariant="h6" transparent>
      <LoadingOverlay loading={isLoading}>
        <Table
          rows={filteredNotifications}
          cols={cols}
          rowsPerPageOptions={[5, 25, 100]}
          rowsPerPage={5}
          pages={hasOffers}
          isLoading={isLoading}
          metadata={{
            acceptOffer: handleAcceptOffer,
            deleteNotification: handleDeleteNotification,
            showOffer: handleShowOffer,
          }}
          caption={
            !hasOffers &&
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
