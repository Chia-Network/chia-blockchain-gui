import { TransactionType } from '@chia-network/api';
import { TableControlledRow } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { TableCell, TableRow, Chip } from '@mui/material';
import React, { useState, ReactNode } from 'react';

import useWalletTransactions from '../hooks/useWalletTransactions';

type Props = {
  walletId: number;
  cols: any[];
  metadata?: any;
  expandedField?: (row: any) => ReactNode;
  expandedCellShift?: number;
};

function WalletHistoryPending(props: Props) {
  const { walletId, cols, metadata, expandedField, expandedCellShift } = props;
  const [expanded, setExpanded] = useState<{
    [key: string]: boolean;
  }>({});
  function handleToggleExpand(rowId: string) {
    setExpanded({
      ...expanded,
      [rowId]: !expanded[rowId],
    });
  }

  const { transactions, isLoading } = useWalletTransactions({
    walletId,
    defaultRowsPerPage: 100,
    defaultPage: 0,
    sortKey: 'RELEVANCE',
    reverse: false,
    confirmed: false,
    typeFilter: {
      mode: 1,
      values: [TransactionType.INCOMING_CLAWBACK_RECEIVE, TransactionType.INCOMING_CLAWBACK_SEND],
    },
  });

  if (isLoading) return null;
  if (!transactions || transactions?.length === 0) return null;
  // console.log('Clawback pending transactions: ', transactions);

  return (
    <>
      <TableRow>
        <TableCell
          colSpan={cols.length}
          sx={{
            backgroundColor: (theme) => theme.palette.grey[600],
            color: 'white',
            fontSize: 16,
            '& svg': {
              verticalAlign: 'middle',
              marginRight: 0.5,
            },
          }}
        >
          <AccessTimeIcon /> <Trans>Pending claw back transactions</Trans>
          <Chip
            label={transactions?.length}
            sx={{
              backgroundColor: (theme) => theme.palette.grey[800],
              marginLeft: 1,
              minWidth: '30px',
              color: 'white',
            }}
            size="small"
          />
        </TableCell>
      </TableRow>

      {transactions?.map((row, rowIndex) => (
        <TableControlledRow
          row={row}
          rowIndex={rowIndex}
          oddRowBackgroundColor="rgba(0,0,0,0.10);"
          currentCols={cols}
          metadata={metadata}
          expandedField={expandedField}
          expanded={expanded}
          handleToggleExpand={handleToggleExpand}
          expandedCellShift={expandedCellShift}
        />
      ))}
      <TableRow>
        <TableCell
          colSpan={cols.length}
          sx={{
            backgroundColor: (theme) => theme.palette.grey[600],
            height: '10px',
            padding: 0,
          }}
        />
      </TableRow>
    </>
  );
}

export default WalletHistoryPending;
