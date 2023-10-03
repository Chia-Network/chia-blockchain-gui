import {
  Flex,
  LayoutDashboardSub,
  TableControlled,
  Row,
  MojoToChia,
  useGetTextFromTransaction,
} from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { Typography, Box } from '@mui/material';
import moment from 'moment';
import React, { useMemo } from 'react';

import NotificationType from '../../constants/NotificationType';
import useValidNotifications from '../../hooks/useValidNotifications';
import OfferDetails from '../offers2/OfferDetails';

function renderOfferText(notification: any, type: string) {
  const offerURLOrData =
    'offerURL' in notification
      ? notification.offerURL
      : 'offerData' in notification
      ? notification.offerData
      : undefined;

  if (type === 'asset') {
    return <OfferDetails id={offerURLOrData} forcePlainText />;
  }
  return <OfferDetails id={offerURLOrData} forcePlainText requested />;
}

const getCols = (getNotificationText: any) => [
  {
    field: (row: Row) => (
      <Box
        component="span"
        sx={{
          position: 'relative',
          top: '2px',
          marginRight: '2px',
        }}
      >
        {row.type === NotificationType.INCOMING_CLAWBACK_RECEIVE ? <Trans>Claw Back</Trans> : <Trans>Offer</Trans>}
      </Box>
    ),
    title: t`Type`,
  },
  {
    field: (row: Row) => (
      <Box
        component="span"
        sx={{
          position: 'relative',
          top: '2px',
          marginRight: '2px',
        }}
      >
        {row.type === NotificationType.INCOMING_CLAWBACK_RECEIVE ? (
          <MojoToChia value={row.amount} />
        ) : (
          renderOfferText(row, 'asset')
        )}
      </Box>
    ),
    title: t`Asset`,
  },
  {
    field: (row: Row) => (
      <Box
        component="span"
        sx={{
          position: 'relative',
          top: '2px',
          marginRight: '2px',
        }}
      >
        {row.type === NotificationType.INCOMING_CLAWBACK_RECEIVE
          ? getNotificationText(row)
          : renderOfferText(row, 'requested')}
      </Box>
    ),
    title: t`Status`,
  },
  {
    field: (row: Row) => (
      <Box
        component="span"
        sx={{
          position: 'relative',
          top: '2px',
          marginRight: '2px',
        }}
      >
        {moment(row.timestamp * 1000).format('LLL')}
      </Box>
    ),
    title: t`Creation Date`,
  },
];

export default function NotificationHistory() {
  const { notifications = [] } = useValidNotifications();

  const [page, setPage] = React.useState(0);

  function onPageChange(_: any, pageLocal: number) {
    setPage(pageLocal);
  }

  const limited = notifications.slice(page * 10, page * 10 + 10);

  const cols = useMemo(() => getCols(useGetTextFromTransaction), []);

  return (
    <LayoutDashboardSub>
      <Flex flexDirection="column" gap={1}>
        <Typography variant="h5">
          <Trans>Notification history</Trans>
        </Typography>
        <TableControlled
          cols={cols}
          rows={limited ?? []}
          page={page}
          count={notifications.length}
          uniqueField="name"
          pages={!!notifications.length}
          onPageChange={onPageChange}
        />
      </Flex>
    </LayoutDashboardSub>
  );
}
