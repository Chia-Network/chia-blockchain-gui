import { useCancelOfferMutation } from '@chia-network/api-react';
import { Card, Flex, More, TableControlled, useOpenDialog, MenuItem } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Cancel } from '@mui/icons-material';
import { Box, ListItemIcon, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import React, { useMemo, useCallback, useState } from 'react';

import useAssetIdName from '../../hooks/useAssetIdName';
import { OfferTradeRecordFormatted } from '../../hooks/useWalletOffers';
import resolveOfferInfo from '../../util/resolveOfferInfo';
import { ConfirmOfferCancellation } from '../offers/ConfirmOfferCancellation';
import OfferState from '../offers/OfferState';

type CancelOfferListProps = {
  title: string | React.ReactElement;
  offers: OfferTradeRecordFormatted[];
  onOfferCanceled: (tradeId: string, secure: boolean, fee: BigNumber) => void;
};

export default function CancelOfferList(props: CancelOfferListProps) {
  const { title, offers, onOfferCanceled } = props;

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
              <Flex style={{ width: '32px' }}>
                {canCancel && (
                  <More>
                    <MenuItem onClick={() => handleCancelOffer(tradeId, false)} close>
                      <ListItemIcon>
                        <Cancel fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="inherit" noWrap>
                        <Trans>Cancel Offer</Trans>
                      </Typography>
                    </MenuItem>
                  </More>
                )}
              </Flex>
            </Flex>
          );
        },
        minWidth: '100px',
        maxWidth: '100px',
        title: <Flex justifyContent="center">Actions</Flex>,
      },
    ];
  }, [cancelOffer, lookupByAssetId, openDialog, onOfferCanceled]);

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
