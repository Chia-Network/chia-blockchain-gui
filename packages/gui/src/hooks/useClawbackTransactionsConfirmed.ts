import { TransactionType, TransactionTypeFilterMode } from '@chia-network/api';
import { useGetTransactionsQuery, useLazyGetTimestampForHeightQuery } from '@chia-network/api-react';
import moment from 'moment';
import React from 'react';

window.moment = moment;

export default function useClawbackTransactionsConfirmed() {
  const { data: clawbackTransactionsConfirmed } = useGetTransactionsQuery({
    walletId: 1,
    start: 0,
    typeFilter: {
      mode: TransactionTypeFilterMode.INCLUDE,
      values: [TransactionType.INCOMING_CLAWBACK_SEND],
    },
    confirmed: true,
  });

  const [getTimestampForHeight] = useLazyGetTimestampForHeightQuery();
  const [transactions, setTransactions] = React.useState([]);

  React.useEffect(() => {
    if (clawbackTransactionsConfirmed) {
      const getTimestampPromise = (transaction: any) =>
        new Promise((resolve) => {
          getTimestampForHeight({ height: transaction.confirmedAtHeight }).then((result: any) => {
            resolve({
              ...transaction,
              confirmedTimestamp: result.data?.timestamp,
              claimed: true,
            });
          });
        });
      Promise.all(clawbackTransactionsConfirmed.map(getTimestampPromise)).then((t: any) => {
        setTransactions(t);
      });
    }
  }, [clawbackTransactionsConfirmed, getTimestampForHeight]);

  return transactions;
}
