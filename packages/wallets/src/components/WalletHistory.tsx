import { WalletType, TransactionType, toBech32m } from '@chia-network/api';
import type { Transaction } from '@chia-network/api';
import {
  useGetOfferRecordMutation,
  useGetSyncStatusQuery,
  useGetTransactionMemoMutation,
} from '@chia-network/api-react';
import {
  Card,
  CopyToClipboard,
  Flex,
  StateColor,
  TableControlled,
  useCurrencyCode,
  useSerializedNavigationState,
  mojoToChia,
  mojoToCAT,
  FormatLargeNumber,
  truncateValue,
} from '@chia-network/core';
import type { Row } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  CallReceived as CallReceivedIcon,
  CallMade as CallMadeIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  Table as TableBase,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import moment from 'moment';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import useWallet from '../hooks/useWallet';
import useWalletTransactions from '../hooks/useWalletTransactions';

const StyledTableCellSmall = styled(TableCell)`
  border-bottom: 0;
  padding-left: 0;
  padding-right: 0 !important;
  vertical-align: top;
`;

const StyledTableCellSmallRight = styled(StyledTableCellSmall)`
  width: 100%;
  padding-left: 1rem;
`;

const StyledWarning = styled(Box)`
  color: ${StateColor.WARNING};
`;

async function handleRowClick(event: React.MouseEvent<HTMLTableRowElement>, row: Row, getOfferRecord, navigate) {
  if (row.tradeId) {
    try {
      const { data: response } = await getOfferRecord(row.tradeId);
      const { tradeRecord, success } = response;

      if (success === true && tradeRecord && navigate) {
        // navigate('/dashboard/offers/view', {
        //   state: { tradeRecord },
        // });
      }
    } catch (e) {
      console.error(e);
    }
  }
}

const getCols = (type: WalletType, isSyncing, getOfferRecord, navigate) => [
  {
    field: (row: Row) => {
      const isOutgoing = [TransactionType.OUTGOING, TransactionType.OUTGOING_TRADE].includes(row.type);

      return (
        <Flex gap={1}>
          <Tooltip title={isOutgoing ? <Trans>Outgoing</Trans> : <Trans>Incoming</Trans>}>
            {isOutgoing ? <CallMadeIcon color="secondary" /> : <CallReceivedIcon color="primary" />}
          </Tooltip>
        </Flex>
      );
    },
  },
  {
    field: (row: Row) => (
      <Typography color="textSecondary" variant="body2">
        {moment(row.createdAtTime * 1000).format('LLL')}
      </Typography>
    ),
    title: <Trans>Date</Trans>,
    forceWrap: true,
  },
  {
    field: (row: Row, metadata) => {
      const isOutgoing = [TransactionType.OUTGOING, TransactionType.OUTGOING_TRADE].includes(row.type);

      return (
        <>
          <strong>{isOutgoing ? <Trans>-</Trans> : <Trans>+</Trans>}</strong>
          &nbsp;
          <strong>
            <FormatLargeNumber value={type === WalletType.CAT ? mojoToCAT(row.amount) : mojoToChia(row.amount)} />
          </strong>
          &nbsp;
          {metadata.unit}
        </>
      );
    },
    title: <Trans>Amount</Trans>,
  },
  {
    field: (row: Row, metadata) => (
      <>
        <strong>
          <FormatLargeNumber value={mojoToChia(row.feeAmount)} />
        </strong>
        &nbsp;
        {metadata.feeUnit}
      </>
    ),
    title: <Trans>Fee</Trans>,
  },
  {
    field: (row: Row, metadata) => {
      const { confirmed: isConfirmed, memos } = row;
      const hasMemos = !!memos && !!Object.keys(memos).length && !!memos[Object.keys(memos)[0]];
      const isRetire = row.toAddress === metadata.retireAddress;
      const isOffer = row.toAddress === metadata.offerTakerAddress;
      const shouldObscureAddress = isRetire || isOffer;

      return (
        <Flex
          flexDirection="column"
          gap={1}
          onClick={(event) => {
            if (!isSyncing) {
              handleRowClick(event, row, getOfferRecord, navigate);
            }
          }}
        >
          <Tooltip
            title={
              <Flex flexDirection="column" gap={1}>
                {shouldObscureAddress && (
                  <StyledWarning>
                    <Trans>This is not a valid address for sending funds to</Trans>
                  </StyledWarning>
                )}
                <Flex flexDirection="row" alignItems="center" gap={1}>
                  <Box maxWidth={200}>{row.toAddress}</Box>
                  {!shouldObscureAddress && <CopyToClipboard value={row.toAddress} fontSize="small" />}
                </Flex>
              </Flex>
            }
          >
            <span>{truncateValue(row.toAddress, {})}</span>
          </Tooltip>
          <Flex gap={0.5}>
            {isConfirmed ? (
              <Chip size="small" variant="outlined" label={<Trans>Confirmed</Trans>} />
            ) : (
              <Chip size="small" color="primary" variant="outlined" label={<Trans>Pending</Trans>} />
            )}
            {hasMemos && <Chip size="small" variant="outlined" label={<Trans>Memo</Trans>} />}
            {isRetire && <Chip size="small" variant="outlined" label={<Trans>Retire</Trans>} />}
            {isOffer && <Chip size="small" variant="outlined" label={<Trans>Offer Accepted</Trans>} />}
          </Flex>
        </Flex>
      );
    },
    title: <Trans>To</Trans>,
  },

  {
    width: '60px',
    field: (row: Row, _metadata, isExpanded, toggleExpand) => (
      <IconButton aria-label="expand row" size="small" onClick={() => toggleExpand(row)}>
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    ),
  },
];

type Props = {
  walletId: number;
};

const mapMemos: any = {};

export default function WalletHistory(props: Props) {
  const { walletId } = props;

  const { data: walletState, isLoading: isWalletSyncLoading } = useGetSyncStatusQuery(
    {},
    {
      pollingInterval: 10_000,
    }
  );
  const { wallet, loading: isWalletLoading, unit } = useWallet(walletId);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const {
    transactions: transactionWithoutIncomingMemos,
    isLoading: isWalletTransactionsLoading,
    page,
    rowsPerPage,
    count,
    pageChange,
  } = useWalletTransactions(walletId, 10, 0, 'RELEVANCE');

  React.useEffect(() => {
    if (!isWalletTransactionsLoading) {
      setTransactions(transactionWithoutIncomingMemos ?? []);
    }
  }, [transactionWithoutIncomingMemos, isWalletTransactionsLoading]);

  const feeUnit = useCurrencyCode();
  const [getOfferRecord] = useGetOfferRecordMutation();
  const { navigate } = useSerializedNavigationState();
  const [getTransactionMemo] = useGetTransactionMemoMutation();

  const isLoading = isWalletTransactionsLoading || isWalletLoading;
  const isSyncing = isWalletSyncLoading || !walletState || !!walletState?.syncing;

  const metadata = useMemo(() => {
    const retireAddress =
      feeUnit && toBech32m('0000000000000000000000000000000000000000000000000000000000000000', feeUnit);

    const offerTakerAddress =
      feeUnit && toBech32m('0101010101010101010101010101010101010101010101010101010101010101', feeUnit);

    return {
      unit,
      feeUnit,
      retireAddress,
      offerTakerAddress,
    };
  }, [unit, feeUnit]);

  const cols = useMemo(() => {
    if (!wallet) {
      return [];
    }

    return getCols(wallet.type, isSyncing, getOfferRecord, navigate);
  }, [getOfferRecord, isSyncing, navigate, wallet]);

  return (
    <Card title={<Trans>Transactions</Trans>} titleVariant="h6" transparent>
      <TableControlled
        cols={cols}
        rows={transactions ?? []}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        page={page}
        rowsPerPage={rowsPerPage}
        count={count}
        onPageChange={pageChange}
        isLoading={isLoading}
        metadata={metadata}
        expandedCellShift={1}
        uniqueField="name"
        onToggleExpand={async (rowId: string, wasExpanded: boolean, rowData: Transaction) => {
          const { name: transactionId, type: transactionType } = rowData ?? {};
          let { memos } = rowData ?? {};

          // We're only interested in attempting to load memos if expanding an incoming txn and the txn doesn't already have memos
          if (!wasExpanded || transactionType !== TransactionType.INCOMING || Object.keys(memos).length > 0) {
            return;
          }

          // Use previously cached memos if available
          memos = mapMemos[rowId];

          // memos is null if we've already tried to fetch memos for this txn and there weren't any
          if (!memos && memos !== null) {
            memos = (await getTransactionMemo({ transactionId })).data;
            mapMemos[rowId] = memos ?? null;
          }

          const newTransactions = transactions.map((transaction) =>
            transaction.name === transactionId && memos && Object.keys(memos).length > 0
              ? { ...transaction, memos }
              : transaction
          );
          setTransactions(newTransactions);
        }}
        // eslint-disable-next-line react/no-unstable-nested-components -- It would be risky to refactor without tests
        expandedField={(row) => {
          const { confirmedAtHeight, memos } = row;
          const memoValues = memos ? Object.values(memos) : [];
          const memoValuesDecoded = memoValues.map((memoHex) => {
            try {
              const buf = Buffer.from(memoHex, 'hex');
              const decodedValue = buf.toString('utf8');

              const bufCheck = Buffer.from(decodedValue, 'utf8');
              if (bufCheck.toString('hex') !== memoHex) {
                throw new Error('Memo is not valid utf8 string');
              }

              return decodedValue;
            } catch (error: any) {
              return memoHex;
            }
          });

          const memosDescription =
            memoValuesDecoded && memoValuesDecoded.length ? (
              <Flex flexDirection="column">
                {memoValuesDecoded.map((memo, index) => (
                  // eslint-disable-next-line react/no-array-index-key -- There is no ID to use
                  <Typography variant="inherit" key={index}>
                    {memo ?? ''}
                  </Typography>
                ))}
              </Flex>
            ) : (
              <Trans>Not Available</Trans>
            );

          const rows = [
            confirmedAtHeight && {
              key: 'confirmedAtHeight',
              label: <Trans>Confirmed at Height</Trans>,
              value: confirmedAtHeight || <Trans>Not Available</Trans>,
            },
            {
              key: 'memos',
              label: <Trans>Memos</Trans>,
              value: memosDescription,
            },
          ].filter((item) => !!item);

          return (
            <TableBase size="small">
              <TableBody>
                {rows.map((rowItem) => (
                  <TableRow key={rowItem.key}>
                    <StyledTableCellSmall>
                      <Typography component="div" variant="body2" color="textSecondary" noWrap>
                        {rowItem.label}
                      </Typography>
                    </StyledTableCellSmall>
                    <StyledTableCellSmallRight>
                      <Box maxWidth="100%">
                        <Typography component="div" variant="body2" noWrap>
                          {rowItem.value}
                        </Typography>
                      </Box>
                    </StyledTableCellSmallRight>
                  </TableRow>
                ))}
              </TableBody>
            </TableBase>
          );
        }}
        caption={
          !transactions?.length && (
            <Typography variant="body2" align="center">
              <Trans>No previous transactions</Trans>
            </Typography>
          )
        }
        pages={!!transactions?.length}
      />
    </Card>
  );
}
