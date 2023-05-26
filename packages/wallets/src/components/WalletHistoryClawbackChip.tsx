import { TransactionType } from '@chia-network/api';
import type { Transaction } from '@chia-network/api';
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
  const t = useTrans();

  let text = '';
  let Icon;
  let onClick;
  const canBeClaimedAt = moment(transactionRow.createdAtTime * 1000);
  if (transactionRow.metadata?.timeLock) {
    canBeClaimedAt.add(transactionRow.metadata.timeLock, 'seconds');
  }
  const currentTime = moment();
  const timeLeft = canBeClaimedAt.diff(currentTime, 'seconds');

  // when you are a recipient of a new clawback transaction
  if (transactionRow.type === TransactionType.INCOMING_CLAWBACK_RECEIVE) {
    if (timeLeft > 0) {
      Icon = <AccessTimeIcon />;
      text = t(
        defineMessage({
          message: 'Can be claimed in ',
        })
      );
      text += canBeClaimedAt.fromNow(true); // ... 3 days
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
    if (timeLeft > 0) {
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
    } else {
      text = t(
        defineMessage({
          message: 'Waiting for recipient to claim',
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
