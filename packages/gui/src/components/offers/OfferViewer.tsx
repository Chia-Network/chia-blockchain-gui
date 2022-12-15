import { OfferSummaryRecord, OfferTradeRecord, OfferCoinOfInterest } from '@chia-network/api';
import { useCheckOfferValidityMutation } from '@chia-network/api-react';
import {
  Back,
  ButtonLoading,
  Card,
  CopyToClipboard,
  Fee,
  Flex,
  Form,
  FormatLargeNumber,
  TableControlled,
  TooltipIcon,
  useShowError,
  mojoToChiaLocaleString,
} from '@chia-network/core';
import { Trans, Plural } from '@lingui/macro';
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
  Typography,
} from '@mui/material';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import useAcceptOfferHook from '../../hooks/useAcceptOfferHook';
import OfferHeader from './OfferHeader';
import OfferState from './OfferState';
import OfferSummary from './OfferSummary';
import OfferViewerTitle from './OfferViewerTitle';
import { colorForOfferState, displayStringForOfferState } from './utils';

type OfferMojoAmountProps = {
  mojos: number;
  mojoThreshold?: number;
};

function OfferMojoAmount(props: OfferMojoAmountProps): React.ReactElement {
  const { mojos, mojoThreshold = 1_000_000_000 } = props;

  return (
    <>
      {mojoThreshold && mojos < mojoThreshold && (
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

type OfferDetailsProps = {
  tradeRecord?: OfferTradeRecord;
  offerData?: string;
  offerSummary?: OfferSummaryRecord;
  imported?: boolean;
};

type OfferDetailsRow = {
  name: React.ReactElement;
  value: any;
  color?: 'initial' | 'inherit' | 'primary' | 'secondary' | 'textPrimary' | 'textSecondary' | 'error';
  tooltip?: React.ReactElement;
};

function OfferDetails(props: OfferDetailsProps) {
  const { tradeRecord, offerData, offerSummary, imported } = props;
  const summary = tradeRecord?.summary || offerSummary;
  const [acceptOffer] = useAcceptOfferHook();
  const navigate = useNavigate();
  const showError = useShowError();
  const methods = useForm({ defaultValues: { fee: '' } });
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(tradeRecord !== undefined);
  const [isMissingRequestedAsset, setIsMissingRequestedAsset] = useState<boolean>(false);
  const [checkOfferValidity] = useCheckOfferValidityMutation();
  const detailRows: OfferDetailsRow[] = [];

  useMemo(async () => {
    if (!offerData) {
      return;
    }

    let valid = false;

    try {
      setIsValidating(true);

      const response = await checkOfferValidity(offerData);

      if (response.data?.success === true) {
        valid = response.data?.valid === true;
      } else {
        showError(response.data?.error ?? new Error('Encountered an unknown error while checking offer validity'));
      }
    } catch (e) {
      showError(e);
    } finally {
      setIsValid(valid);
      setIsValidating(false);
    }
  }, [offerData]);

  if (tradeRecord) {
    detailRows.push({
      name: <Trans>Status</Trans>,
      value: displayStringForOfferState(tradeRecord.status),
      color: colorForOfferState(tradeRecord.status),
    });

    detailRows.push({
      name: <Trans>Offer Identifier</Trans>,
      value: tradeRecord.tradeId,
    });

    detailRows.push({
      name: <Trans>Confirmed at Height</Trans>,
      value: tradeRecord.confirmedAtIndex || <Trans>Not confirmed</Trans>,
    });

    if (!tradeRecord.isMyOffer) {
      detailRows.push({
        name: <Trans>Accepted on Date</Trans>,
        value: tradeRecord.acceptedAtTime ? (
          moment(tradeRecord.acceptedAtTime * 1000).format('LLL')
        ) : (
          <Trans>Not accepted</Trans>
        ),
      });
    }

    detailRows.push({
      name: <Trans>Creation Date</Trans>,
      value: moment(tradeRecord.createdAtTime * 1000).format('LLL'),
    });

    detailRows.push({
      name: <Trans>Node Count</Trans>,
      tooltip: <Trans>This number reflects the number of nodes that the accepted SpendBundle has been sent to</Trans>,
      value: tradeRecord.sent,
    });
  }

  const coinCols = [
    {
      field: (coin: OfferCoinOfInterest) => (
        <Typography variant="body2">
          <Flex flexDirection="row" flexGrow={1} gap={1}>
            {mojoToChiaLocaleString(coin.amount)}
          </Flex>
        </Typography>
      ),
      title: <Trans>Amount</Trans>,
    },
    {
      field: (coin: OfferCoinOfInterest) => (
        <Tooltip
          title={
            <Flex alignItems="center" gap={1}>
              <Box maxWidth={200}>{coin.parentCoinInfo}</Box>
              <CopyToClipboard value={coin.parentCoinInfo} fontSize="small" />
            </Flex>
          }
        >
          <span>{coin.parentCoinInfo}</span>
        </Tooltip>
      ),
      minWidth: '200px',
      title: <Trans>Parent Coin</Trans>,
    },
    {
      field: (coin: OfferCoinOfInterest) => (
        <Tooltip
          title={
            <Flex alignItems="center" gap={1}>
              <Box maxWidth={200}>{coin.puzzleHash}</Box>
              <CopyToClipboard value={coin.puzzleHash} fontSize="small" />
            </Flex>
          }
        >
          <span>{coin.puzzleHash}</span>
        </Tooltip>
      ),
      fullWidth: true,
      title: <Trans>Puzzle Hash</Trans>,
    },
  ];

  async function handleAcceptOffer(formData: any) {
    const { fee } = formData;

    if (!offerData) {
      console.error('No offer data to accept');
      return;
    }

    await acceptOffer(
      offerData,
      summary,
      fee,
      (accepting: boolean) => setIsAccepting(accepting),
      () => navigate(-2)
    );
  }

  return (
    <Flex flexDirection="column" gap={4}>
      <OfferHeader
        isMyOffer={tradeRecord?.isMyOffer}
        isInvalid={!isValidating && !isValid}
        isComplete={tradeRecord?.status === OfferState.CONFIRMED}
      />
      {summary && (
        <Flex flexDirection="column" gap={2}>
          <Typography variant="h5">
            <Trans>Summary</Trans>
          </Typography>
          <Card>
            <OfferSummary
              isMyOffer={tradeRecord?.isMyOffer}
              imported={!!imported}
              summary={summary}
              makerTitle={
                <Typography variant="h6">
                  <Trans>In exchange for</Trans>
                </Typography>
              }
              takerTitle={
                <Typography variant="h6">
                  <Trans>You will receive</Trans>
                </Typography>
              }
              setIsMissingRequestedAsset={(isMissing: boolean) => setIsMissingRequestedAsset(isMissing)}
            />
            {imported && (
              <Form methods={methods} onSubmit={handleAcceptOffer}>
                <Flex flexDirection="column" gap={3}>
                  <Divider />
                  {isValid && (
                    <Grid direction="column" xs={4} container>
                      <Fee
                        id="filled-secondary"
                        variant="filled"
                        name="fee"
                        color="secondary"
                        label={<Trans>Fee</Trans>}
                        disabled={isAccepting}
                      />
                    </Grid>
                  )}
                  <Flex flexDirection="row" gap={3}>
                    <Button variant="outlined" onClick={() => navigate(-1)} disabled={isAccepting}>
                      <Trans>Back</Trans>
                    </Button>
                    <ButtonLoading
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={!isValid || isMissingRequestedAsset}
                      loading={isAccepting}
                    >
                      <Trans>Accept Offer</Trans>
                    </ButtonLoading>
                  </Flex>
                </Flex>
              </Form>
            )}
          </Card>
        </Flex>
      )}
      {tradeRecord && (
        <Card title={<Trans>Details</Trans>} transparent>
          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                {detailRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {row.name} {row.tooltip && <TooltipIcon>{row.tooltip}</TooltipIcon>}
                    </TableCell>
                    <TableCell align="right">
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
        <Card title={<Trans>Coins</Trans>} transparent>
          <TableControlled rows={tradeRecord.coinsOfInterest} cols={coinCols} />
        </Card>
      )}
    </Flex>
  );
}

type OfferViewerProps = {
  tradeRecord?: OfferTradeRecord;
  offerData?: string;
  offerSummary?: OfferSummaryRecord;
  offerFilePath?: string;
  imported?: boolean;
};

export function OfferViewer(props: OfferViewerProps) {
  const { offerData, offerFilePath, offerSummary, tradeRecord, imported, ...rest } = props;

  return (
    <Flex flexDirection="column" gap={3}>
      <Back variant="h5">
        <OfferViewerTitle offerFilePath={offerFilePath} tradeRecord={tradeRecord} />
      </Back>

      <OfferDetails
        tradeRecord={tradeRecord}
        offerData={offerData}
        offerSummary={offerSummary}
        imported={imported}
        {...rest}
      />
    </Flex>
  );
}
