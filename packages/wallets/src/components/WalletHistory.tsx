import { WalletType, TransactionType, TransactionTypeFilterMode, toBech32m } from '@chia-network/api';
import type { Transaction } from '@chia-network/api';
import {
  useGetOfferRecordMutation,
  useGetSyncStatusQuery,
  useGetTransactionMemoMutation,
} from '@chia-network/api-react';
import {
  AddressBookContext,
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
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
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
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

import useWallet from '../hooks/useWallet';
import useWalletTransactions from '../hooks/useWalletTransactions';
import ClawbackClaimTransactionDialog from './ClawbackClaimTransactionDialog';
import WalletHistoryClawbackChip from './WalletHistoryClawbackChip';
import WalletHistoryPending from './WalletHistoryPending';

function getIsIncomingClawbackTransaction(transactionRow: Transaction) {
  return [TransactionType.INCOMING_CLAWBACK_RECEIVE, TransactionType.INCOMING_CLAWBACK_SEND].includes(
    transactionRow.type
  );
}

function getIsOutgoingTransaction(transactionRow: Transaction) {
  return [TransactionType.OUTGOING, TransactionType.OUTGOING_TRADE, TransactionType.INCOMING_CLAWBACK_SEND].includes(
    transactionRow.type
  );
}

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

async function handleRowClick(
  event: React.MouseEvent<HTMLTableRowElement>,
  row: Row,
  getOfferRecord,
  navigate,
  location
) {
  if (row.tradeId) {
    try {
      const { data: response } = await getOfferRecord({ offerId: row.tradeId });
      const {
        tradeRecord: { summary },
        success,
      } = response;

      if (success === true && summary && navigate && location) {
        navigate('/dashboard/offers/view', {
          state: { offerSummary: summary, imported: false, isMyOffer: false, referrerPath: location.pathname },
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
}

const getCols = (type: WalletType, isSyncing, getOfferRecord, navigate, location) => [
  {
    field: (row: Row, metadata) => {
      const isOutgoing = getIsOutgoingTransaction(row);

      return (
        <>
          <Box
            component="span"
            sx={{
              color: (theme) => (isOutgoing ? 'unset' : theme.palette.primary.main),
              fontSize: 20,
              position: 'relative',
              top: '2px',
              marginRight: '2px',
            }}
          >
            <strong>{isOutgoing ? <Trans>-</Trans> : <Trans>+</Trans>}</strong>
          </Box>
          &nbsp;
          <strong>
            <FormatLargeNumber value={type === WalletType.CAT ? mojoToCAT(row.amount) : mojoToChia(row.amount)} />
          </strong>
          &nbsp;
          {metadata.unit}
        </>
      );
    },
    title: <Trans>Asset</Trans>,
  },
  {
    field: (row: Row, metadata) => {
      const isIncomingClawback = getIsIncomingClawbackTransaction(row);

      const { confirmed: isConfirmed } = row;
      // const { memos } = row;
      // const hasMemos = !!memos && !!Object.keys(memos).length && !!memos[Object.keys(memos)[0]];
      const isRetire = row.toAddress === metadata.retireAddress;
      const isOffer = row.toAddress === metadata.offerTakerAddress;
      const shouldObscureAddress = isRetire || isOffer;

      let displayAddress = truncateValue(row.toAddress, {});
      let displayEmoji = null;

      if (metadata.matchList) {
        metadata.matchList.forEach((contact) => {
          if (contact.address === row.toAddress) {
            displayAddress = contact.displayName;
            displayEmoji = contact.emoji;
          }
        });
      }

      return (
        <Flex
          flexDirection="column"
          gap={1}
          onClick={(event) => {
            if (!isSyncing) {
              handleRowClick(event, row, getOfferRecord, navigate, location);
            }
          }}
        >
          <div>
            <Typography variant="caption" component="span">
              <Trans>To: </Trans>
            </Typography>
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
              <span>
                {displayEmoji} {displayAddress}
              </span>
            </Tooltip>
          </div>
          <Flex gap={0.5}>
            {isIncomingClawback && (
              <WalletHistoryClawbackChip
                transactionRow={row}
                setClawbackClaimTransactionDialogProps={metadata.setClawbackClaimTransactionDialogProps}
              />
            )}
            {!isIncomingClawback && (
              <>
                {isConfirmed ? (
                  <Chip size="small" variant="outlined" color="secondary" label={<Trans>Confirmed</Trans>} />
                ) : (
                  <Chip size="small" color="primary" variant="outlined" label={<Trans>Pending</Trans>} />
                )}
              </>
            )}

            {/* {hasMemos && <Chip size="small" variant="outlined" label={<Trans>Memo</Trans>} />} */}
            {isRetire && <Chip size="small" variant="outlined" label={<Trans>Retire</Trans>} />}
            {isOffer && <Chip size="small" variant="outlined" label={<Trans>Offer Accepted</Trans>} />}
          </Flex>
        </Flex>
      );
    },
    title: <Trans>Status</Trans>,
  },

  {
    field: (row: Row) => (
      <Typography color="textSecondary" variant="body2">
        {moment(row.createdAtTime * 1000).format('LLL')}
      </Typography>
    ),
    title: <Trans>Creation Date</Trans>,
    forceWrap: true,
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
    width: '70px',
    field: (row: Row, metadata, isExpanded, toggleExpand) => (
      <IconButton aria-label="expand row" size="small" onClick={() => toggleExpand(row)}>
        {isExpanded ? <ExpandLessIcon color="info" /> : <ExpandMoreIcon color="info" />}
      </IconButton>
    ),
  },
];

type Props = {
  walletId: number;
};

// null means transaction memo was tried but it has no memo
type TransactionResolvedMemos = Record<string, Array<String> | null>;

export default function WalletHistory(props: Props) {
  const { walletId } = props;

  const { data: walletState, isLoading: isWalletSyncLoading } = useGetSyncStatusQuery(undefined, {
    pollingInterval: 10_000,
  });
  const { wallet, loading: isWalletLoading, unit } = useWallet(walletId);
  const [transactionResolvedMemos, setTransactionResolvedMemos] = React.useState<TransactionResolvedMemos>({});

  const {
    transactions,
    isLoading: isWalletTransactionsLoading,
    page,
    rowsPerPage,
    count,
    pageChange,
  } = useWalletTransactions({
    walletId,
    defaultRowsPerPage: 10,
    defaultPage: 0,
    sortKey: 'RELEVANCE',
    reverse: false,
    // confirmed: true,
    typeFilter: {
      mode: TransactionTypeFilterMode.EXCLUDE,
      values: [TransactionType.INCOMING_CLAWBACK_RECEIVE, TransactionType.INCOMING_CLAWBACK_SEND],
    },
  });

  const feeUnit = useCurrencyCode();
  const [getOfferRecord] = useGetOfferRecordMutation();
  const { navigate, location } = useSerializedNavigationState();
  const [getTransactionMemo] = useGetTransactionMemoMutation();

  const [, , , , , getContactByAddress] = useContext(AddressBookContext);

  const isLoading = isWalletTransactionsLoading || isWalletLoading;
  const isSyncing = isWalletSyncLoading || !walletState || !!walletState?.syncing;
  const isSynced = !isSyncing && walletState?.synced;

  const [clawbackClaimTransactionDialogProps, setClawbackClaimTransactionDialogProps] = React.useState<{
    coinId: string;
    amountInMojo: number;
    fromOrTo: 'from' | 'to';
    address: string;
  } | null>(null);

  const handleCloseClawbackClaimTransactionDialog = useCallback(() => setClawbackClaimTransactionDialogProps(null), []);

  const contacts = useMemo(() => {
    if (!transactions || isWalletTransactionsLoading) {
      return [];
    }

    const contactList: { displayName: string; address: string }[] = [];

    (transactions ?? []).forEach((transaction) => {
      const match = getContactByAddress(transaction.toAddress);

      if (match) {
        match.addresses.forEach((addressInfo) => {
          if (transaction.toAddress === addressInfo.address) {
            const nameStr = JSON.stringify(match.name).slice(1, -1);
            const emojiStr = match.emoji ? match.emoji : '';
            const matchColor = (theme) => `${match.color ? theme.palette.colors[match.color].main : null}`;
            const addNameStr = JSON.stringify(addressInfo.name).slice(1, -1);
            const matchName = `${emojiStr} ${nameStr} | ${addNameStr}`;
            contactList.push({ displayName: matchName, address: addressInfo.address, color: matchColor });
          }
        });
      }
    });
    return contactList;
  }, [transactions, getContactByAddress, isWalletTransactionsLoading]);

  const metadata = useMemo(() => {
    const retireAddress =
      feeUnit && toBech32m('0000000000000000000000000000000000000000000000000000000000000000', feeUnit);

    const offerTakerAddress =
      feeUnit && toBech32m('0101010101010101010101010101010101010101010101010101010101010101', feeUnit);

    const matchList = contacts;

    return {
      unit,
      feeUnit,
      retireAddress,
      offerTakerAddress,
      setClawbackClaimTransactionDialogProps,
      matchList,
    };
  }, [unit, feeUnit, contacts]);

  const cols = useMemo(() => {
    if (!wallet) {
      return [];
    }

    return getCols(wallet.type, isSyncing, getOfferRecord, navigate, location);
  }, [getOfferRecord, isSyncing, navigate, wallet, location]);

  const loadTransactionMemos = async (_rowId: string, wasExpanded: boolean, rowData: Transaction) => {
    const { name: transactionId, type: transactionType } = rowData ?? {};
    const { memos } = rowData ?? {};

    // We're only interested in attempting to load memos if expanding an incoming txn and the txn doesn't already have memos
    if (!wasExpanded || transactionType !== TransactionType.INCOMING || Object.keys(memos).length > 0) {
      return;
    }

    const resolvedMemos = transactionResolvedMemos[transactionId];

    // memos is null if we've already tried to fetch memos for this txn and there weren't any
    if (!resolvedMemos && resolvedMemos !== null) {
      let resolvedMemo = (await getTransactionMemo({ transactionId })).data;
      if (!resolvedMemo || Object.keys(resolvedMemo).length === 0) resolvedMemo = null;
      setTransactionResolvedMemos((prev) => ({ ...prev, [transactionId]: resolvedMemo }));
    }
  };

  const expandedField = useCallback(
    (row) => {
      const { confirmedAtHeight, name: transactionId } = row;
      let { memos } = row;

      if (!memos || Object.keys(memos).length === 0) {
        memos = transactionResolvedMemos[transactionId];
      }

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
        TransactionType.INCOMING_CLAWBACK_SEND === row.type &&
          row.metadata?.timeLock && {
            key: 'clawBackExpiration',
            label: <Trans>Claw back expiration</Trans>,
            value: moment(row.createdAtTime * 1000)
              .add(row.metadata.timeLock, 'seconds')
              .format('LLL'),
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
    },
    [transactionResolvedMemos]
  );

  const ExtraRowsAfterHeader = useMemo(
    () =>
      isSynced && (
        <WalletHistoryPending
          walletId={walletId}
          cols={cols}
          metadata={metadata}
          expandedField={expandedField}
          expandedCellShift={1}
        />
      ),
    [cols, expandedField, metadata, walletId, isSynced]
  );

  return (
    <Card title={<Trans>Transactions</Trans>} titleVariant="h6" transparent>
      <ClawbackClaimTransactionDialog
        {...clawbackClaimTransactionDialogProps}
        onClose={handleCloseClawbackClaimTransactionDialog}
        open={!!clawbackClaimTransactionDialogProps}
      />
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
        onToggleExpand={loadTransactionMemos}
        expandedField={expandedField}
        caption={
          !transactions?.length && (
            <Typography variant="body2" align="center">
              <Trans>No previous transactions</Trans>
            </Typography>
          )
        }
        pages={!!transactions?.length}
        ExtraRowsAfterHeader={ExtraRowsAfterHeader}
      />
    </Card>
  );
}
