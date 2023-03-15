import { useCancelOfferMutation } from '@chia-network/api-react';
import { Card, Flex, Button, TableControlled, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import React, { useMemo, useCallback, useState } from 'react';

import useAssetIdName from '../../hooks/useAssetIdName';
import { OfferTradeRecordFormatted } from '../../hooks/useWalletOffers';
import resolveOfferInfo, { resolveOfferInfoWithPendingAmounts } from '../../util/resolveOfferInfo';
import { ConfirmOfferCancellation } from '../offers/ConfirmOfferCancellation';
import OfferState from '../offers/OfferState';

type CancelOfferListProps = {
  title: string | React.ReactElement;
  offers: OfferTradeRecordFormatted[];
  onOfferCanceled: (tradeId: string, secure: boolean, fee: BigNumber) => void;
  allowSecureCancelling?: boolean;
};

export default function CancelOfferList(props: CancelOfferListProps) {
  const { title, offers, onOfferCanceled, allowSecureCancelling = false } = props;

  const [cancelOffer] = useCancelOfferMutation();
  const { lookupByAssetId } = useAssetIdName();
  const openDialog = useOpenDialog();

  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [page, setPage] = useState(0);
  const onPageChange = useCallback(
    (_rowsPerPage: number, _page: number) => {
      if (_rowsPerPage !== rowsPerPage) {
        setRowsPerPage(_rowsPerPage);
      }
      if (_page !== page) {
        setPage(_page);
      }
    },
    [rowsPerPage, page]
  );

  const cols = useMemo(() => {
    async function handleCancelOffer(tradeId: string, canCancelWithTransaction: boolean) {
      const [cancelConfirmed, cancellationOptions] = await openDialog(
        <ConfirmOfferCancellation canCancelWithTransaction={canCancelWithTransaction} />
      );

      if (cancelConfirmed === true) {
        const secure = canCancelWithTransaction ? cancellationOptions.cancelWithTransaction : false;
        const fee = canCancelWithTransaction ? cancellationOptions.cancellationFee : 0;
        await cancelOffer({ tradeId, secure, fee });
        onOfferCanceled(tradeId, secure, fee);
      }
    }

    return [
      {
        field: (row: OfferTradeRecordFormatted) => {
          const resolvedOfferInfo = resolveOfferInfo(row.summary, 'offered', lookupByAssetId);
          return resolvedOfferInfo.map((info) => (
            <Flex flexDirection="row" gap={0.5} key={`${info.displayAmount}-${info.displayName}`}>
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
        field: (row: OfferTradeRecordFormatted) => {
          const resolvedOfferInfo = resolveOfferInfo(row.summary, 'requested', lookupByAssetId);
          return resolvedOfferInfo.map((info) => (
            <Flex flexDirection="row" gap={0.5} key={`${info.displayAmount}-${info.displayName}`}>
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
        field: (row: OfferTradeRecordFormatted) => {
          const resolvedOfferInfo = resolveOfferInfoWithPendingAmounts(row, 'offered', lookupByAssetId);
          return resolvedOfferInfo.map((info) => (
            <Flex flexDirection="row" gap={0.5} key={`${info.displayPendingAmount}-${info.displayName}`}>
              <Typography variant="body2">{(info.displayPendingAmount as any).toString()}</Typography>
              <Typography noWrap variant="body2">
                {info.displayName}
              </Typography>
            </Flex>
          ));
        },
        minWidth: '160px',
        title: <Trans>Locked</Trans>,
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: OfferTradeRecordFormatted) => {
          const { createdAtTime } = row;

          return (
            <Box>
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
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: OfferTradeRecordFormatted) => {
          const { tradeId, status } = row;
          const canCancel = status === OfferState.PENDING_ACCEPT || status === OfferState.PENDING_CONFIRM;

          return (
            <Flex flexDirection="row" justifyContent="center" gap={0}>
              <Flex>
                {canCancel && (
                  <Button
                    onClick={() => handleCancelOffer(tradeId, allowSecureCancelling)}
                    variant="contained"
                    color="danger"
                    size="small"
                  >
                    <Typography variant="inherit" noWrap>
                      <Trans>Cancel</Trans>
                    </Typography>
                  </Button>
                )}
              </Flex>
            </Flex>
          );
        },
        minWidth: '120px',
        maxWidth: '120px',
        title: <Flex justifyContent="center">Actions</Flex>,
      },
    ];
  }, [cancelOffer, lookupByAssetId, openDialog, onOfferCanceled, allowSecureCancelling]);

  const hasOffers = !!offers?.length;

  return (
    <Card title={title} titleVariant="h6" transparent>
      <TableControlled
        rows={offers}
        cols={cols}
        rowsPerPageOptions={[3, 5, 10]}
        count={offers.length}
        rowsPerPage={rowsPerPage}
        pages={hasOffers}
        page={page}
        onPageChange={onPageChange}
        caption={!hasOffers}
      />
    </Card>
  );
}
