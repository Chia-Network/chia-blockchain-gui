import { TransactionType, TransactionTypeFilterMode } from '@chia-network/api';
import { Color, TableControlledRow, useDarkMode } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { TableCell, TableRow, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const { isDarkMode } = useDarkMode();
  const theme: any = useTheme();
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
      mode: TransactionTypeFilterMode.INCLUDE,
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
            backgroundColor: theme.palette.surfaces?.panel ?? (isDarkMode ? Color.Neutral[500] : Color.Neutral[400]),
            color: theme.palette.ink?.menu ?? Color.Neutral[50],
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
              backgroundColor:
                theme.palette.surfaces?.panelBorder ?? (isDarkMode ? Color.Neutral[700] : Color.Neutral[500]),
              marginLeft: 1,
              minWidth: '30px',
              color: theme.palette.ink?.menu ?? Color.Neutral[50],
            }}
            size="small"
          />
        </TableCell>
      </TableRow>

      {transactions?.map((row, rowIndex) => (
        <TableControlledRow
          row={row}
          rowIndex={rowIndex}
          oddRowBackgroundColor={
            theme.palette.surfaces?.tableRowAlternate ?? (isDarkMode ? Color.Neutral[700] : Color.Neutral[300])
          }
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
            backgroundColor: theme.palette.surfaces?.panel ?? (isDarkMode ? Color.Neutral[500] : Color.Neutral[400]),
            height: '10px',
            padding: 0,
          }}
        />
      </TableRow>
    </>
  );
}

export default WalletHistoryPending;
