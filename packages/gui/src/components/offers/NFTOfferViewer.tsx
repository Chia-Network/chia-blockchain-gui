import React, { useMemo, useState } from 'react';
import { t, Trans } from '@lingui/macro';
import { useGetNFTWallets } from '@chia/api-react';
import type { NFTInfo, Wallet } from '@chia/api';
import { Back, Flex } from '@chia/core';
import { Divider, Grid, Typography } from '@mui/material';
import useFetchNFTs from '../../hooks/useFetchNFTs';
import OfferHeader from './OfferHeader';
import OfferState from './OfferState';
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
/*                              NFT Offer Summary                             */
/* ========================================================================== */

type NFTOfferSummaryProps = {
  isMyOffer: boolean;
  imported: boolean;
  summary: any;
  makerTitle: React.ReactElement | string;
  takerTitle: React.ReactElement | string;
};

function NFTOfferSummary(props: NFTOfferSummaryProps) {
  const { isMyOffer, imported, summary, makerTitle, takerTitle } = props;
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
        <div key={index}>
          {summary}
          {index !== summaries.length - 1 && <Divider />}
        </div>
      ))}
    </>
  );
}

/* ========================================================================== */
/*                              NFT Offer Details                             */
/* ========================================================================== */

type NFTOfferDetailsProps = {
  tradeRecord?: any /*OfferTradeRecord*/;
  offerData?: string;
  offerSummary?: any /* OfferSummaryRecord */;
  offerFilePath?: string;
  imported?: boolean;
};

function NFTOfferDetails(props: NFTOfferDetailsProps) {
  const { tradeRecord, offerData, offerSummary, offerFilePath, imported } =
    props;
  const summary = tradeRecord?.summary || offerSummary;
  const isMyOffer = !!tradeRecord?.isMyOffer;
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(tradeRecord !== undefined);
  const { wallets: nftWallets, isLoading: isLoadingWallets } =
    useGetNFTWallets();
  const { nfts, isLoading: isLoadingNFTs } = useFetchNFTs(
    nftWallets.map((wallet: Wallet) => wallet.id),
  );
  const nft: NFTInfo | undefined = useMemo(() => {
    const driverDict: { [key: string]: any } = offerSummary?.infos;
    const launcherId = Object.keys(driverDict ?? {}).find((id: string) => {
      return driverDict[id].launcherId?.length > 0;
    });

    if (launcherId && nfts.length > 0) {
      return nfts.find((nft: NFTInfo) => nft.launcherId === launcherId);
    }
  }, [offerSummary, nfts]);

  return (
    <Flex flexDirection="column" flexGrow={1} gap={4}>
      <OfferHeader
        isMyOffer={isMyOffer}
        isInvalid={!isValidating && !isValid}
        isComplete={tradeRecord?.status === OfferState.CONFIRMED}
      />

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
            <NFTOfferSummary
              isMyOffer={isMyOffer}
              imported={!!imported}
              summary={summary}
              makerTitle={
                <Typography variant="body1">
                  <Trans>You will receive</Trans>
                </Typography>
              }
              takerTitle={
                <Typography variant="body1">
                  <Trans>In exchange for</Trans>
                </Typography>
              }
            />
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
  tradeRecord?: any /*OfferTradeRecord*/;
  offerData?: string;
  offerSummary?: any /* OfferSummaryRecord */;
  offerFilePath?: string;
  imported?: boolean;
};

export default function NFTOfferViewer(props: NFTOfferViewerProps) {
  const { tradeRecord, offerData, offerSummary, offerFilePath, imported } =
    props;

  return (
    <Grid container>
      <Flex flexDirection="column" flexGrow={1} gap={3}>
        <Flex>
          <Back variant="h5">
            <Trans>Viewing Offer</Trans>
          </Back>
        </Flex>
        <NFTOfferDetails
          tradeRecord={tradeRecord}
          offerData={offerData}
          offerSummary={offerSummary}
          offerFilePath={offerFilePath}
          imported={imported}
        />
      </Flex>
    </Grid>
  );
}
