import React, { useMemo } from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { Trans, Plural } from '@lingui/macro';
import {
  AlertDialog,
  Back,
  Card,
  CardHeader,
  CopyToClipboard,
  Flex,
  FormatLargeNumber,
  TableControlled,
  TooltipIcon,
  useShowError
} from '@chia/core';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography
} from '@material-ui/core';
import { OfferSummary, OfferTradeRecord } from '@chia/api';
import {
  colorForOfferState,
  displayStringForOfferState,
  formatAmountForWalletType
} from './utils';
import useAssetIdName from '../../../hooks/useAssetIdName';
import WalletType from '../../../constants/WalletType';
import OfferCoinOfInterest from 'types/OfferCoinOfInterest';
import styled from 'styled-components';

const StyledViewerBox = styled.div`
  padding: ${({ theme }) => `${theme.spacing(4)}px`};
`;

const StyledSummaryBox = styled.div`
  padding-left: ${({ theme }) => `${theme.spacing(2)}px`};
  padding-right: ${({ theme }) => `${theme.spacing(2)}px`};
`;

const StyledHeaderBox = styled.div`
  padding-top: ${({ theme }) => `${theme.spacing(1)}px`};
  padding-bottom: ${({ theme }) => `${theme.spacing(1)}px`};
  padding-left: ${({ theme }) => `${theme.spacing(2)}px`};
  padding-right: ${({ theme }) => `${theme.spacing(2)}px`};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.palette.background.paper};
`;

type OfferMojoAmountProps = {
  mojos: number;
  mojoThreshold?: number
};

function OfferMojoAmount(props: OfferMojoAmountProps): React.ReactElement{
  const { mojos, mojoThreshold } = props;

  return (
    <>
      { mojos < mojoThreshold && (
        <Flex flexDirection="row" flexGrow={1} gap={1}>
          (
          <FormatLargeNumber value={mojos} />
          <Box>
            <Plural value={mojos} one="mojo" other="mojos" />
          </Box>
          )
        </Flex>
      )}
    </>
  );
}

OfferMojoAmount.defaultProps = {
  mojos: 0,
  mojoThreshold: 1000000000,  // 1 billion
};

type OfferDetailsProps = {
  tradeRecord?: OfferTradeRecord;
  offerSummary?: OfferSummary;
};

type OfferDetailsRow = {
  name: React.ReactElement;
  value: any;
  color?: string;
  tooltip?: React.ReactElement;
};

function OfferDetails(props: OfferDetailsProps) {
  const { tradeRecord, offerSummary } = props;
  const summary = tradeRecord?.summary || offerSummary;
  const lookupAssetId = useAssetIdName();
  let detailRows: OfferDetailsRow[] = [];

  if (tradeRecord) {
    detailRows = [
      {
        name: <Trans>Status</Trans>,
        value: displayStringForOfferState(tradeRecord.status),
        color: colorForOfferState(tradeRecord.status),
      },
      {
        name: <Trans>Offer Identifier</Trans>,
        value: tradeRecord.tradeId,
      },
      {
        name: <Trans>Confirmed at Height</Trans>,
        value: tradeRecord.confirmedAtIndex || <Trans>Not confirmed</Trans>,
      },
      {
        name: <Trans>Accepted on Date</Trans>,
        value: tradeRecord.acceptedAtTime ? (
          moment(tradeRecord.acceptedAtTime * 1000).format('LLL')
        ) : (
          <Trans>Not accepted</Trans>
        ),
      },
      {
        name: <Trans>Creation Date</Trans>,
        value: moment(tradeRecord.createdAtTime * 1000).format('LLL'),
      },
      {
        name: <Trans>Node Count</Trans>,
        tooltip: <Trans>This number reflects the number of nodes that the accepted SpendBundle has been sent to</Trans>,
        value: tradeRecord.sent,
      },
    ];
  }

  const coinCols = [
    {
      field: (coin: OfferCoinOfInterest) => {
        return (
          <Typography variant="body2">
            <Flex flexDirection="row" flexGrow={1} gap={1}>
              <FormatLargeNumber value={coin.amount} />
              <Box>
                <Plural value={coin.amount} one="mojo" other="mojos" />
              </Box>
            </Flex>
          </Typography>
        )
      },
      title: <Trans>Amount</Trans>
    },
    {
      field: (coin: OfferCoinOfInterest) => {
        return (
          <Tooltip
            title={
              <Flex alignItems="center" gap={1}>
                <Box maxWidth={200}>{coin.parentCoinInfo}</Box>
                <CopyToClipboard value={coin.parentCoinInfo} fontSize="small" />
              </Flex>
            }
            interactive
          >
            <span>{coin.parentCoinInfo}</span>
          </Tooltip>
        )
      },
      minWidth: '200px',
      title: <Trans>Parent Coin</Trans>
    },
    {
      field: (coin: OfferCoinOfInterest) => {
        return (
          <Tooltip
            title={
              <Flex alignItems="center" gap={1}>
                <Box maxWidth={200}>{coin.puzzleHash}</Box>
                <CopyToClipboard value={coin.puzzleHash} fontSize="small" />
              </Flex>
            }
            interactive
          >
            <span>{coin.puzzleHash}</span>
          </Tooltip>
        )
      },
      fullWidth: true,
      title: <Trans>Puzzle Hash</Trans>
    }
  ];

  function OfferSummaryEntry({ assetId, amount, ...rest}) {
    const assetIdInfo = lookupAssetId(assetId);
    const displayAmount = assetIdInfo ? formatAmountForWalletType(amount as number, assetIdInfo.walletType) : `${amount}`;
    const displayName = assetIdInfo?.displayName ?? 'unknown';

    return (
      <Flex flexDirections="row" gap={1}>
        <Typography variant="body1" {...rest}>
          {displayAmount} {displayName}
        </Typography>
        {assetIdInfo?.walletType === WalletType.STANDARD_WALLET && (
          <Typography variant="body1" color="textSecondary">
            <OfferMojoAmount mojos={amount} />
          </Typography>
        )}
      </Flex>
    );
  }

  return (
    <StyledViewerBox>
      <Flex flexDirection="column" gap={3}>
        {tradeRecord?.isMyOffer && (
          <StyledHeaderBox>
            <Flex flexDirection="column" flexGrow={1} gap={3}>
              <Typography variant="subtitle1" color="primary">You created this offer</Typography>
            </Flex>
          </StyledHeaderBox>
        )}
        {summary && (
          <Card title={<Trans>Summary</Trans>}>
            <StyledSummaryBox>
              <Flex flexDirection="column" flexGrow={1} gap={3}>
                <Typography variant="h6">In exchange for</Typography>
                {Object.entries(summary.requested).map(([assetId, amount]) => (
                  <OfferSummaryEntry assetId={assetId} amount={amount} />
                ))}
                <Divider />
                <Typography variant="h6">You will receive</Typography>
                {Object.entries(summary.offered).map(([assetId, amount]) => (
                  <OfferSummaryEntry assetId={assetId} amount={amount} />
                ))}
              </Flex>
            </StyledSummaryBox>
          </Card>
        )}
        {tradeRecord && (
          <Card title={<Trans>Details</Trans>}>
            <TableContainer component={Paper}>
              <Table>
                <TableBody>
                  {detailRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {row.name}{' '}
                        {row.tooltip && <TooltipIcon>{row.tooltip}</TooltipIcon>}
                      </TableCell>
                      <TableCell onClick={row.onClick} align="right">
                        <Typography variant="body2" color={row.color}>
                          {row.value}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
        {tradeRecord && tradeRecord.coinsOfInterest?.length > 0 && (
          <Card title={<Trans>Coins</Trans>}>
            <TableControlled
              rows={tradeRecord.coinsOfInterest}
              cols={coinCols}
            />
          </Card>
        )}
      </Flex>
    </StyledViewerBox>
  );
}

type OfferViewerProps = {
  tradeRecord?: OfferTradeRecord;
  offerSummary?: OfferSummary;
  offerFilePath?: string;
};

export function OfferViewer(props: OfferViewerProps) {
  const { offerFilePath, offerSummary, tradeRecord, ...rest } = props;
  const history = useHistory();

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5">
            {offerFilePath ? (
              <Trans>Viewing offer: {offerFilePath}</Trans>
            ) : (
              <Trans>Viewing offer created at {moment(tradeRecord.createdAtTime * 1000).format('LLL')}</Trans>
            )}
          </Back>
        </Flex>
        <OfferDetails tradeRecord={tradeRecord} offerSummary={offerSummary} {...rest} />
      </Flex>
    </Grid>
  );
}