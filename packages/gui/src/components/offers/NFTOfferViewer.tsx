import React from 'react';
import { Trans } from '@lingui/macro';
import type { NFTInfo } from '@chia/api';
import { Back, Flex } from '@chia/core';
import { Divider, Grid, Typography } from '@mui/material';
import OfferHeader from './OfferHeader';
import NFTOfferPreview from './NFTOfferPreview';

/* ========================================================================== */
/*                           NFT Offer Maker Summary                          */
/* ========================================================================== */

type NFTOfferMakerSummaryProps = {
  title: React.ReactElement | string;
};

function NFTOfferMakerSummary(props: NFTOfferMakerSummaryProps) {
  const { title } = props;

  return (
    <Flex flexDirection="column" gap={2}>
      {title}
      <Flex flexDirection="column" gap={1}>
        <Typography variant="h5">NFT Title</Typography>
        <Typography variant="body2">By NFT Creator Title</Typography>
        <Typography variant="caption" color="textSecondary">
          nft17aadeznq3hwxtwhwq6xpj0pxy7dakdxzwmqgqsrydeszgvsdke9qcyu0c7
        </Typography>
      </Flex>
    </Flex>
  );
}

/* ========================================================================== */
/*                           NFT Offer Taker Summary                          */
/* ========================================================================== */

type NFTOfferTakerSummaryProps = {
  title: React.ReactElement | string;
};

function NFTOfferTakerSummary(props: NFTOfferTakerSummaryProps) {
  const { title } = props;

  return (
    <Flex flexDirection="column" gap={2}>
      {title}
      <Typography variant="h5">300 XCH</Typography>
    </Flex>
  );
}

/* ========================================================================== */
/*                           NFT Offer Maker Details                          */
/* ========================================================================== */

type NFTOfferSummaryProps = {
  isMyOffer: boolean;
  imported: boolean;
  summary: any;
};

function NFTOfferSummary(props: NFTOfferSummaryProps) {
  const { isMyOffer, imported, summary } = props;
  const makerTitle: React.ReactElement = (
    <Typography variant="body1">
      <Trans>You will receive</Trans>
    </Typography>
  );
  const takerTitle: React.ReactElement = (
    <Typography variant="body1">
      <Trans>In exchange for</Trans>
    </Typography>
  );
  const makerSummary: React.ReactElement = (
    <NFTOfferMakerSummary title={makerTitle} />
  );
  const takerSummary: React.ReactElement = (
    <NFTOfferTakerSummary title={takerTitle} />
  );
  const summaries: React.ReactElement[] = [makerSummary, takerSummary];

  if (isMyOffer) {
    summaries.reverse();
  }

  return (
    <>
      <Typography variant="h6" style={{ fontWeight: 'bold' }}>
        <Trans>Purchase Summary</Trans>
      </Typography>
      {summaries.map((summary, index) => (
        <>
          {summary}
          {index !== summaries.length - 1 && <Divider />}
        </>
      ))}
    </>
  );
}

/* ========================================================================== */
/*                          NFT Offer Viewer Content                          */
/* ========================================================================== */

type NFTOfferDetailsProps = {
  nft: NFTInfo; // temporary until offer parsing is supported
};

function NFTOfferDetails(props: NFTOfferDetailsProps) {
  const { nft } = props;

  return (
    <Flex flexDirection="column" flexGrow={1} gap={4}>
      <OfferHeader isMyOffer={true} isInvalid={false} isComplete={false} />

      <Flex
        flexDirection="column"
        flexGrow={1}
        gap={1}
        style={{
          border: '1px solid #E0E0E0',
          boxSizing: 'border-box',
          borderRadius: '8px',
        }}
      >
        <Flex direction="row">
          <Flex
            flexDirection="column"
            flexGrow={1}
            gap={3}
            style={{ padding: '1em' }}
          >
            <NFTOfferSummary isMyOffer={true} imported={false} summary={nft} />
            <Divider />
          </Flex>
          <NFTOfferPreview nft={nft} />
        </Flex>
      </Flex>
    </Flex>
  );
}

/* ========================================================================== */
/*                              NFT Offer Viewer                              */
/* ========================================================================== */

type NFTOfferViewerProps = {
  nft: NFTInfo; // temporary until offer parsing is supported
};

export default function NFTOfferViewer(props: NFTOfferViewerProps) {
  const { nft } = props;

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5">
            <Trans>Viewing Offer</Trans>
          </Back>
        </Flex>
        <NFTOfferDetails nft={nft} />
      </Flex>
    </Grid>
  );
}
