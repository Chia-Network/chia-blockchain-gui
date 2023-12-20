import { AlertDialog, Flex } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import React from 'react';

type WalletSendTransactionResultDialogProps = {
  success: boolean;
  message: string;
};

function WalletSendTransactionResultDialogTitle(success: boolean, message: string): React.ReactElement | undefined {
  if (success) {
    return <Trans>Success</Trans>;
  }

  if (message === 'MEMPOOL_CONFLICT') {
    return <Trans>Mempool Conflict</Trans>;
  }

  if (message === 'INVALID_FEE_TOO_CLOSE_TO_ZERO' || message === 'INVALID_FEE_LOW_FEE') {
    return <Trans>Mempool Full</Trans>;
  }

  return undefined;
}

function WalletSendTransactionResultDialogContent(
  success: boolean,
  message: string
): React.ReactElement | string | undefined {
  if (success) {
    return message ?? <Trans>Transaction has successfully been sent to a full node and included in the mempool.</Trans>;
  }

  let message1;
  let message2;

  if (message === 'MEMPOOL_CONFLICT') {
    message1 = t`The transaction is pending inclusion in the mempool because it conflicts with one or more other transactions
    already in the mempool. The transaction will be retried periodically, and may be included in the mempool if
    the conflicting transactions are removed.`;
  }

  if (message === 'INVALID_FEE_TOO_CLOSE_TO_ZERO' || message === 'INVALID_FEE_LOW_FEE') {
    message1 = t`The transaction could not be immediately included in the mempool because the specified fee is too low. The
    transaction will be retried periodically, and may be included in the mempool once fees are lower, or if
    space becomes available.`;
    message2 = t`If you would like to speed up the transaction, please delete unconfirmed transactions and retry with a
    higher fee.`;
  }

  if (message1) {
    return (
      <Flex flexDirection="column" gap={3}>
        <Flex>{message1}</Flex>
        {message2 && <Flex>{message2}</Flex>}
      </Flex>
    );
  }

  return undefined;
}

export default function CreateWalletSendTransactionResultDialog(
  props: WalletSendTransactionResultDialogProps
): React.ReactElement | undefined {
  const { success, message, ...rest } = props;
  const title = WalletSendTransactionResultDialogTitle(success, message);
  const content = WalletSendTransactionResultDialogContent(success, message);

  if (title && content) {
    return (
      <AlertDialog title={title} {...rest}>
        {content}
      </AlertDialog>
    );
  }
  return undefined;
}
