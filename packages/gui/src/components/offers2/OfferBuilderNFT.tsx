import { Flex, Loading, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Grid, Typography, Card } from '@mui/material';
import React from 'react';
import { useWatch } from 'react-hook-form';

import useNFT from '../../hooks/useNFT';
import useNFTMinterDID from '../../hooks/useNFTMinterDID';
import NFTCard from '../nfts/NFTCard';
import { NFTContextualActionTypes } from '../nfts/NFTContextualActions';
import { isValueNFTId } from '../nfts/NFTSearch';
import OfferBuilderNFTProvenance from './OfferBuilderNFTProvenance';
import OfferBuilderNFTRoyalties from './OfferBuilderNFTRoyalties';
import OfferBuilderValue from './OfferBuilderValue';

function PreviewCard(props) {
  const { children } = props;
  return (
    <Card sx={{ minHeight: 362 }} variant="outlined">
      <Flex flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1} padding={3}>
        {children}
      </Flex>
    </Card>
  );
}

export type OfferBuilderNFTProps = {
  name: string;
  onRemove?: () => void;
  provenance?: boolean;
  showRoyalties?: boolean;
  offering?: boolean;
};

export default function OfferBuilderNFT(props: OfferBuilderNFTProps) {
  const { name, provenance = false, showRoyalties = false, onRemove, offering = false } = props;

  const fieldName = `${name}.nftId`;
  const value = useWatch({
    name: fieldName,
  });

  const { didId: minterDID, didName: minterDIDName } = useNFTMinterDID(value);
  const { nft, isLoading, error } = useNFT(value);

  const hasNFT = !!nft;

  return (
    <Flex flexDirection="column" gap={2}>
      <Flex flexDirection="column" gap={1}>
        <OfferBuilderValue name={fieldName} type="text" label={<Trans>NFT ID</Trans>} onRemove={onRemove} />
        {(minterDID || minterDIDName) && (
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1" color="textSecondary">
              <Trans>Minter</Trans>
            </Typography>
            <Tooltip title={minterDID} copyToClipboard>
              <Typography variant="body2" color="textPrimary" noWrap>
                {minterDIDName ?? minterDID}
              </Typography>
            </Tooltip>
          </Flex>
        )}
      </Flex>

      {isValueNFTId(value) && (
        <Flex flexDirection="column" gap={2}>
          <Typography variant="body2" color="textSecondary">
            <Trans>Preview</Trans>
          </Typography>
          <Grid spacing={3} container>
            <Grid xs={12} md={6} item>
              {isLoading ? (
                <PreviewCard>
                  <Loading />
                </PreviewCard>
              ) : error ? (
                <Typography variant="body1" color="error">
                  {error.message}
                </Typography>
              ) : nft ? (
                <NFTCard
                  id={nft.launcherId}
                  canExpandDetails={false}
                  availableActions={
                    NFTContextualActionTypes.CopyNFTId +
                    NFTContextualActionTypes.ViewOnExplorer +
                    NFTContextualActionTypes.OpenInBrowser +
                    NFTContextualActionTypes.CopyURL +
                    NFTContextualActionTypes.Invalidate
                  }
                  isOffer
                />
              ) : (
                <PreviewCard>
                  <Typography>
                    <Trans>NFT not specified</Trans>
                  </Typography>
                </PreviewCard>
              )}
            </Grid>
            <Grid xs={12} md={6} item>
              <Flex flexDirection="column" gap={2}>
                {showRoyalties && hasNFT && <OfferBuilderNFTRoyalties nft={nft} offering={offering} />}
                {provenance && hasNFT && <OfferBuilderNFTProvenance nft={nft} />}
              </Flex>
            </Grid>
          </Grid>
        </Flex>
      )}
    </Flex>
  );
}
