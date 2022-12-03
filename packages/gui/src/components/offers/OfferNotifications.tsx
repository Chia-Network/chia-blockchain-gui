import { type OfferTradeRecord } from '@chia/api';
import { useGetAllOffersQuery, useCancelOfferMutation, useGetWalletsQuery } from '@chia/api-react';
import { useOpenDialog, Flex, TableControlled, LoadingOverlay } from '@chia/core';
import { Trans } from '@lingui/macro';
import { Box, Button, Chip, Typography } from '@mui/material';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import useAssetIdName from '../../hooks/useAssetIdName';
import OfferDataDialog from './OfferDataDialog';
import { ConfirmOfferCancellation, resolveOfferInfo } from './OfferManager';
import OfferState from './OfferState';
import { colorForOfferState, displayStringForOfferState } from './utils';

export type NotificationsTableProps = {
  nftId?: string;
};

export default function NotificationsTable(props: NotificationsTableProps) {
  const { nftId } = props;

  const navigate = useNavigate();
  const [cancelOffer] = useCancelOfferMutation();
  const { isLoading: isLoadingWallets } = useGetWalletsQuery();
  const { lookupByAssetId } = useAssetIdName();
  const openDialog = useOpenDialog();
  const { data: offers, isLoading: isOffersLoading } = useGetAllOffersQuery({
    includeMyOffers: true,
    includeTakenOffers: true,
  });

  const filteredOffers = useMemo(() => {
    if (!offers) {
      return [];
    }

    return offers.filter((offer) => offer.nft_id === nftId);
  }, [offers, nftId]);

  console.log('offers', offers);
  console.log('filteredOffers', filteredOffers);

  const isLoading = isOffersLoading || isLoadingWallets;
  const hasOffers = !!offers?.length;

  async function handleShowOfferData(offerData: string) {
    openDialog(<OfferDataDialog offerData={offerData} />);
  }

  async function handleCancelOffer(tradeId: string, canCancelWithTransaction: boolean) {
    const [cancelConfirmed, cancellationOptions] = await openDialog(
      <ConfirmOfferCancellation canCancelWithTransaction={canCancelWithTransaction} />
    );

    if (cancelConfirmed === true) {
      const secure = canCancelWithTransaction ? cancellationOptions.cancelWithTransaction : false;
      const fee = canCancelWithTransaction ? cancellationOptions.cancellationFee : 0;
      await cancelOffer({ tradeId, secure, fee });
    }
  }

  function handleRowClick(event: any, row: OfferTradeRecord) {
    navigate('/dashboard/offers/view', {
      state: {
        referrerPath: '/dashboard/offers',
        offerSummary: row.summary,
        isMyOffer: row.isMyOffer,
        state: row.status,
      },
    });
  }

  const cols = useMemo(
    () => [
      {
        field: (row: OfferTradeRecord) => {
          const { status } = row;

          return (
            <Box onClick={(event) => handleRowClick(event, row)}>
              <Chip label={displayStringForOfferState(status)} variant="outlined" color={colorForOfferState(status)} />
            </Box>
          );
        },
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Status</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const resolvedOfferInfo = resolveOfferInfo(row.summary, 'offered', lookupByAssetId);
          return resolvedOfferInfo.map((info, index) => (
            <Flex flexDirection="row" gap={0.5} key={`${index}-${info.displayName}`}>
              <Typography variant="body2">{(info.displayAmount as any).toString()}</Typography>
              <Typography noWrap variant="body2">
                {info.displayName}
              </Typography>
            </Flex>
          ));
        },
        minWidth: '160px',
        title: <Trans>Offered</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const resolvedOfferInfo = resolveOfferInfo(row.summary, 'requested', lookupByAssetId);
          return resolvedOfferInfo.map((info, index) => (
            <Flex flexDirection="row" gap={0.5} key={`${index}-${info.displayName}`}>
              <Typography variant="body2">{(info.displayAmount as any).toString()}</Typography>
              <Typography noWrap variant="body2">
                {info.displayName}
              </Typography>
            </Flex>
          ));
        },
        minWidth: '160px',
        title: <Trans>Requested</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const { createdAtTime } = row;

          return (
            <Box onClick={(event) => handleRowClick(event, row)}>
              <Typography color="textSecondary" variant="body2">
                {moment(createdAtTime * 1000).format('LLL')}
              </Typography>
            </Box>
          );
        },
        minWidth: '220px',
        maxWidth: '220px',
        title: <Trans>Creation Date</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const { tradeId, status } = row;
          const canDisplayData = status === OfferState.PENDING_ACCEPT;
          const canCancel = status === OfferState.PENDING_ACCEPT || status === OfferState.PENDING_CONFIRM;
          const canCancelWithTransaction = canCancel && status === OfferState.PENDING_ACCEPT;

          return (
            <Flex gap={1}>
              <Button onClick={() => handleRowClick(undefined, row)}>
                <Trans>Caunter</Trans>
              </Button>

              {canCancel && (
                <Button onClick={() => handleCancelOffer(tradeId, canCancelWithTransaction)}>
                  <Trans>Cancel Offer</Trans>
                </Button>
              )}
            </Flex>
          );
        },
        minWidth: '100px',
        maxWidth: '100px',
        title: <Flex justifyContent="center">Actions</Flex>,
      },
    ],
    []
  );

  return (
    <LoadingOverlay loading={isLoading}>
      <TableControlled
        rows={offers}
        cols={cols}
        rowsPerPageOptions={[5, 25, 100]}
        pages={hasOffers}
        isLoading={isOffersLoading}
        caption={
          !hasOffers &&
          !isLoading && (
            <Typography variant="body2" align="center">
              <Trans>No current offers</Trans>
            </Typography>
          )
        }
      />
    </LoadingOverlay>
  );
}
