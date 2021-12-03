import React from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { Trans } from '@lingui/macro';
import { AlertDialog, Back, Card, Dropzone, Flex, useShowError } from '@chia/core';
import { Box, Button, Divider, Grid, Typography } from '@material-ui/core';
import { OfferSummary, OfferTradeRecord } from '@chia/api';
import { formatOfferEntry } from './utils';
import styled from 'styled-components';

const StyledEditorBox = styled.div`
  padding: ${({ theme }) => `${theme.spacing(4)}px`};
`;

type OfferDetailsProps = {
  tradeRecord?: OfferTradeRecord;
  offerSummary?: OfferSummary;
};

function OfferDetails(props: OfferDetailsProps) {
  const { tradeRecord, offerSummary } = props;
  const summary = tradeRecord?.summary || offerSummary;

  return (
    <StyledEditorBox>
      <Flex flexDirection="column" gap={3}>
        {summary && (
          <Card>
            <Flex flexDirection="column" flexGrow={1} gap={3}>
              <Typography variant="h6">In exchange for</Typography>
              {Object.entries(summary.requested).map(([assetId, amount]) => (
                <Typography variant="body1">{formatOfferEntry(assetId, amount)}</Typography>
              ))}
              <Divider />
              <Typography variant="h6">You will receive</Typography>
              {Object.entries(summary.offered).map(([assetId, amount]) => (
                <Typography variant="body1">{formatOfferEntry(assetId, amount)}</Typography>
              ))}
            </Flex>
          </Card>
        )}
        {tradeRecord && (
          <Card>
            <Flex flexDirection="column" flexGrow={1} gap={3}>
              <Typography variant="h6">Confirmed at index: {tradeRecord.confirmedAtIndex}</Typography>
              <Typography variant="h6">Accepted at time: {tradeRecord.acceptedAtTime}</Typography>
              <Typography variant="h6">Created at time: {tradeRecord.createdAtTime}</Typography>
              <Typography variant="h6">Is my offer: {tradeRecord.isMyOffer}</Typography>
            </Flex>
          </Card>
        )}
      </Flex>
    </StyledEditorBox>
  );
}

type OfferViewerProps = {
  tradeRecord?: OfferTradeRecord;
  offerSummary?: OfferSummary;
  offerFilePath?: string;
};

export function OfferViewer(props: OfferViewerProps) {
  const { offerFilePath, tradeRecord, ...rest } = props;
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
        <OfferDetails tradeRecord={tradeRecord} {...rest} />
      </Flex>
    </Grid>
  );
}