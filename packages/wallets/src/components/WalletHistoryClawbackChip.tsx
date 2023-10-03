import { TransactionType } from '@chia-network/api';
import type { Transaction } from '@chia-network/api';
import { useGetTimestampForHeightQuery, useGetHeightInfoQuery } from '@chia-network/api-react';
import { useTrans, Button, useGetTextFromTransaction } from '@chia-network/core';
import { defineMessage } from '@lingui/macro';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { Chip } from '@mui/material';
import React from 'react';

type Props = {
  transactionRow: Transaction;
  setClawbackClaimTransactionDialogProps: (props: object) => void;
};

export default function WalletHistoryClawbackChip(props: Props) {
  const { transactionRow, setClawbackClaimTransactionDialogProps } = props;

  const { data: height, isLoading: isGetHeightInfoLoading } = useGetHeightInfoQuery(undefined, {
    pollingInterval: 3000,
  });

  const { data: lastBlockTimeStampData, isLoading: isGetTimestampForHeightLoading } = useGetTimestampForHeightQuery({
    height: height || 0,
  });

  const lastBlockTimeStamp = lastBlockTimeStampData?.timestamp || 0;

  const t = useTrans();
  let text = '';
  text = useGetTextFromTransaction(transactionRow);

  if (isGetHeightInfoLoading || isGetTimestampForHeightLoading || !lastBlockTimeStamp) return null;

  let Icon;
  let onClick;

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
      color={onClick ? 'primary' : 'info'}
      onClick={onClick}
      icon={Icon}
      label={<>{text}</>}
    />
  );
}
