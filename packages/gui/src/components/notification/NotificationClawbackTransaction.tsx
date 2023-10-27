import { useGetAutoClaimQuery, useGetTimestampForHeightQuery, useGetHeightInfoQuery } from '@chia-network/api-react';
import { Flex, MojoToChia, useTrans, useGetTextFromTransaction } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import HumanTimestamp from '../helpers/HumanTimestamp';

import NotificationWrapper from './NotificationWrapper';

export default function NotificationClawbackTransaction(props: any) {
  const { notification, onClick = () => {} } = props;

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

  const navigate = useNavigate();

  function handleClick() {
    navigate('/dashboard/wallets');
    onClick();
  }

  function renderMessage() {
    if (notification.passedTimeLock) {
      return <Trans>Claw back transaction can be claimed</Trans>;
    }
    if (notification.claimed) {
      return <Trans>Transaction claimed</Trans>;
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
            {useGetTextFromTransaction(
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
