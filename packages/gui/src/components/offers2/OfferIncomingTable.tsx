import { toBech32m } from '@chia-network/api';
import { Card, Flex, Table, LoadingOverlay, Button, useShowError, Tooltip, useCurrencyCode } from '@chia-network/core';
import { Offers as OffersIcon } from '@chia-network/icons';
import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import React, { useMemo, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import NotificationType from '../../constants/NotificationType';
import useNotifications, { type NotificationDetails } from '../../hooks/useNotifications';
import HeightToTimestamp from '../helpers/HeightToTimestamp';
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
            {resolvedOfferInfo.map((info) => (
              <Flex flexDirection="row" gap={0.5} key={`${info.displayAmount}-${info.displayName}`}>
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
      return resolvedOfferInfo.map((info) => (
        <Flex flexDirection="row" gap={0.5} key={`${info.displayAmount}-${info.displayName}`}>
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
    field: (notification: NotificationDetails) => <HeightToTimestamp height={notification.height} />,
    title: <Trans>Creation Date</Trans>,
  },
  {
    field: (notification: NotificationDetails, { deleteNotification, showOffer, counterOffer }) => {
      const {
        id,
        metadata: {
          data: { puzzleHash },
        },
      } = notification;

      async function handleDelete() {
        await deleteNotification(id);
      }

      function handleShowOffer() {
        showOffer(id);
      }

      async function handleCounter() {
        await counterOffer(id);
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
  const { notifications = [], isLoading, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const currencyCode = useCurrencyCode();
  const showError = useShowError();

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (![NotificationType.OFFER, NotificationType.COUNTER_OFFER].includes(notification.type)) {
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

  async function handleCounterOffer(id: string) {
    try {
      const {
        offer,
        metadata: {
          data: { puzzleHash },
        },
      } = filteredNotifications.find((notification) => notification.id === id);

      if (!puzzleHash || !currencyCode) {
        return;
      }

      const address = currencyCode && puzzleHash ? toBech32m(puzzleHash, currencyCode.toLowerCase()) : '';

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

  async function handleDeleteNotification(id: string) {
    try {
      await deleteNotification(id);
    } catch (e) {
      showError(e);
    }
  }

  function handleShowOffer(id: string) {
    const {
      offerData,
      offerSummary,
      metadata: {
        data: { puzzleHash },
      },
    } = filteredNotifications.find((notification) => notification.id === id);
    const canCounterOffer = puzzleHash?.length > 0;

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
