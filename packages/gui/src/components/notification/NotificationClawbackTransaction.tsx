import type { Transaction } from '@chia-network/api';
import { useGetAutoClaimQuery, useGetTimestampForHeightQuery, useGetHeightInfoQuery } from '@chia-network/api-react';
import { Flex, MojoToChia, useTrans } from '@chia-network/core';
import { Trans, defineMessage } from '@lingui/macro';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Typography } from '@mui/material';
import moment from 'moment';
import React from 'react';

import HumanTimestamp from '../helpers/HumanTimestamp';

import NotificationWrapper from './NotificationWrapper';

function getTextFromTransaction(
  transactionRow: Transaction,
  t: any,
  lastBlockTimeStamp: number,
  isAutoClaimEnabled: any,
  isGetHeightInfoLoading: boolean,
  isGetTimestampForHeightLoading: boolean
) {
  let text = '';
  const canBeClaimedAt = moment(transactionRow.timestamp * 1000);
  if (transactionRow?.timeLock) {
    canBeClaimedAt.add(transactionRow.timeLock, 'seconds');
  }
  const currentTime = moment.unix(lastBlockTimeStamp - 20); // extra 20 seconds so if the auto claim is enabled, it will not show to button to claim it

  const timeLeft = canBeClaimedAt.diff(currentTime, 'seconds');

  if (isGetHeightInfoLoading || isGetTimestampForHeightLoading || !lastBlockTimeStamp) return null;
  if (timeLeft > 0 && !transactionRow.passedTimeLock) {
    text = isAutoClaimEnabled
      ? t(
          defineMessage({
            message: 'Will be autoclaimed in ',
          })
        )
      : t(
          defineMessage({
            message: 'Can be claimed in ',
          })
        );
    text += canBeClaimedAt.from(currentTime, true); // ... 3 days
  } else if (transactionRow.sent === 0) {
    text = t(
      defineMessage({
        message: 'Claim transaction',
      })
    );
  } else {
    text = t(
      defineMessage({
        message: 'Claiming...',
      })
    );
  }
  return text;
}

export default function NotificationClawbackTransaction(props: any) {
  const { notification } = props;

  const { data: height, isLoading: isGetHeightInfoLoading } = useGetHeightInfoQuery(undefined, {
    pollingInterval: 3000,
  });

  const { data: lastBlockTimeStampData, isLoading: isGetTimestampForHeightLoading } = useGetTimestampForHeightQuery({
    height: height || 0,
  });

  const { data: autoClaimData, isLoading: isGetAutoClaimLoading } = useGetAutoClaimQuery();
  const isAutoClaimEnabled = !isGetAutoClaimLoading && autoClaimData?.enabled;

  const lastBlockTimeStamp = lastBlockTimeStampData?.timestamp || 0;

  const t = useTrans();

  function handleClick() {
    /* todo - open history page */
  }

  function renderMessage() {
    if (notification.passedTimeLock) {
      return <Trans>Claw back transaction can be claimed</Trans>;
    }
    return <Trans>You have a new claw back transaction</Trans>;
  }

  return (
    <NotificationWrapper onClick={handleClick} icon={<AccessTimeIcon sx={{ fontSize: '32px !important' }} />}>
      <Flex flexDirection="column">
        <Typography variant="subtitle2" color="textSecondary">
          {renderMessage()}
          {' · '}
          (<HumanTimestamp value={notification.timestamp} fromNow /> ago)
          <Flex>
            {getTextFromTransaction(
              notification,
              t,
              lastBlockTimeStamp,
              isAutoClaimEnabled,
              isGetHeightInfoLoading,
              isGetTimestampForHeightLoading
            )}
          </Flex>
        </Typography>
        <Typography variant="body2">
          <MojoToChia value={notification.amount} />
        </Typography>
      </Flex>
    </NotificationWrapper>
  );
}
