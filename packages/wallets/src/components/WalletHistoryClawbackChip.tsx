import { TransactionType } from '@chia-network/api';
import type { Transaction } from '@chia-network/api';
import { useGetAutoClaimQuery, useGetTimestampForHeightQuery, useGetHeightInfoQuery } from '@chia-network/api-react';
import { useTrans, Button } from '@chia-network/core';
import { defineMessage } from '@lingui/macro';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { Chip } from '@mui/material';
import moment from 'moment';
import React from 'react';

type Props = {
  transactionRow: Transaction;
  setClawbackClaimTransactionDialogProps: (props: object) => void;
};

export default function WalletHistoryClawbackChip(props: Props) {
  const { transactionRow, setClawbackClaimTransactionDialogProps } = props;

  const { data: autoClaimData, isLoading: isGetAutoClaimLoading } = useGetAutoClaimQuery();
  const isAutoClaimEnabled = !isGetAutoClaimLoading && autoClaimData?.enabled;

  const { data: height, isLoading: isGetHeightInfoLoading } = useGetHeightInfoQuery(undefined, {
    pollingInterval: 3000,
  });

  const { data: lastBlockTimeStampData, isLoading: isGetTimestampForHeightLoading } = useGetTimestampForHeightQuery({
    height: height || 0,
  });

  const lastBlockTimeStamp = lastBlockTimeStampData?.timestamp || 0;

  const t = useTrans();

  if (isGetHeightInfoLoading || isGetTimestampForHeightLoading || !lastBlockTimeStamp) return null;

  let text = '';
  let Icon;
  let onClick;
  const canBeClaimedAt = moment(transactionRow.createdAtTime * 1000);
  if (transactionRow.metadata?.timeLock) {
    canBeClaimedAt.add(transactionRow.metadata.timeLock, 'seconds');
  }
  const currentTime = moment.unix(lastBlockTimeStamp - 20); // extra 20 seconds so if the auto claim is enabled, it will not show to button to claim it
  // console.log('currentTime___: ', currentTime.format());
  // console.log('canBeClaimedAt: ', canBeClaimedAt.format());

  const timeLeft = canBeClaimedAt.diff(currentTime, 'seconds');

  // when you are a recipient of a new clawback transaction
  if (transactionRow.type === TransactionType.INCOMING_CLAWBACK_RECEIVE) {
    if (timeLeft > 0) {
      Icon = <AccessTimeIcon />;

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

      onClick = () =>
        setClawbackClaimTransactionDialogProps({
          coinId: transactionRow.metadata?.coinId,
          amountInMojo: transactionRow.amount,
          fromOrTo: 'from',
          address: transactionRow.toAddress,
        });
    } else {
      Icon = <AccessTimeIcon />;
      text = t(
        defineMessage({
          message: 'Claiming...',
        })
      );
    }
  }

  // when you create/send clawback transaction
  if (transactionRow.type === TransactionType.INCOMING_CLAWBACK_SEND) {
    if (transactionRow.sent === 0) {
      text = t(
        defineMessage({
          message: 'Claw back this transaction',
        })
      );

      onClick = () =>
        setClawbackClaimTransactionDialogProps({
          coinId: transactionRow.metadata?.coinId,
          amountInMojo: transactionRow.amount,
          fromOrTo: 'to',
          address: transactionRow.toAddress,
        });
    } else {
      Icon = <AccessTimeIcon />;
      text = t(
        defineMessage({
          message: 'Clawing back...',
        })
      );
    }
  }

  if (onClick) {
    return (
      <Button variant="outlined" color="primary" onClick={onClick} size="small">
        {text}
      </Button>
    );
  }
  return (
    <Chip
      size="small"
      variant="outlined"
      color={onClick ? 'primary' : 'default'}
      onClick={onClick}
      icon={Icon}
      label={<>{text}</>}
    />
  );
}
