import { t } from '@lingui/macro';

export const mempoolInclusionStatus = {
  SUCCESS: 1, // Transaction added to mempool
  PENDING: 2, // Transaction not yet added to mempool
  FAILED: 3, // Transaction was invalid and dropped
};

export default function getTransactionResult(transaction): {
  message: string;
  success: boolean;
} {
  if (!transaction || !transaction.sentTo || !transaction.sentTo.length) {
    return {
      message: t`Transaction has not been sent to node yet`,
      success: true,
    };
  }

  // At least one node has accepted our transaction
  const hasSuccess = !!transaction.sentTo.find((item) => item[1] === mempoolInclusionStatus.SUCCESS);
  if (hasSuccess) {
    return {
      message: t`Transaction has successfully been sent to a full node and included in the mempool.`,
      success: true,
    };
  }

  // At least one node has accepted our transaction as pending
  const pendingNodeResponse = transaction.sentTo.find((item) => item[1] === mempoolInclusionStatus.PENDING);

  // Note: A refactoring of this is probably warranted, especially if additional mempool statuses need special handling
  //
  // For now, MEMPOOL_CONFLICT will be treated as a failure, but we'll display an error explaining that the full node
  // will retry to include the txn if the conflicts are resolved.
  const ignoredMempoolStatuses = ['MEMPOOL_CONFLICT'];

  if (pendingNodeResponse && !ignoredMempoolStatuses.includes(pendingNodeResponse[2])) {
    return {
      message: t`Transaction has been sent to a full node and is pending inclusion into the mempool. ${pendingNodeResponse[2]}`,
      success: true,
    };
  }

  // No nodes have accepted our transaction, so display the error message of the first
  return {
    message: transaction.sentTo[0][2],
    success: false,
  };
}
