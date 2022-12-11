import { type NFTInfo } from '@chia-network/api';
import { IconButton, Flex, Loading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { MoreVert } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import useNFTMetadata from '../../hooks/useNFTMetadata';
import NFTContextualActions, { NFTContextualActionTypes } from './NFTContextualActions';
import NFTPreview from './NFTPreview';

const StyledCardContent = styled(CardContent)`
  //padding-top: ${({ theme }) => theme.spacing(1)};
  // padding-bottom: ${({ theme }) => theme.spacing(1)} !important;
`;

const StyledLoadingCardContent = styled(CardContent)`
  min-height: 362px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export type NFTCardProps = {
  nft: NFTInfo;
  canExpandDetails: boolean;
  availableActions: NFTContextualActionTypes;
  isOffer: boolean;
};

export default function NFTCard(props: NFTCardProps) {
  const { nft, canExpandDetails = true, availableActions = NFTContextualActionTypes.None, isOffer } = props;

  const navigate = useNavigate();

  const { metadata, isLoading, error } = useNFTMetadata([nft]);

  function handleClick() {
    if (canExpandDetails) {
      navigate(`/dashboard/nfts/${nft.$nftId}`);
    }
  }

  return (
    <Flex flexDirection="column" flexGrow={1}>
      <Card sx={{ borderRadius: '8px' }} variant="outlined">
        {isLoading ? (
          <StyledLoadingCardContent>
            <Loading center />
          </StyledLoadingCardContent>
        ) : (
          <>
            <CardActionArea onClick={handleClick}>
              <NFTPreview
                nft={nft}
                isPreview
                metadata={metadata}
                isLoadingMetadata={isLoading}
                disableThumbnail={isOffer}
                metadataError={error}
              />
            </CardActionArea>
            <CardActionArea onClick={() => canExpandDetails && handleClick()} component="div">
              <StyledCardContent>
                <Flex justifyContent="space-between" alignItems="center">
                  <Flex gap={1} alignItems="center" minWidth={0}>
                    <Typography noWrap>{metadata?.name ?? <Trans>Title Not Available</Trans>}</Typography>
                  </Flex>
                  {availableActions !== NFTContextualActionTypes.None && (
                    <NFTContextualActions
                      selection={{ items: [nft] }}
                      availableActions={availableActions}
                      toggle={
                        <IconButton>
                          <MoreVert />
                        </IconButton>
                      }
                    />
                  )}
                </Flex>
              </StyledCardContent>
            </CardActionArea>
          </>
        )}
      </Card>
    </Flex>
  );
}
