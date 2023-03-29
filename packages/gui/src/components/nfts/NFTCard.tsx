import { type NFTInfo } from '@chia-network/api';
import { IconButton, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { MoreVert } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import CheckIcon from '../../assets/img/checkmark.svg';
import useNFTMetadata from '../../hooks/useNFTMetadata';
import NFTContextualActions, { NFTContextualActionTypes } from './NFTContextualActions';
import NFTPreview from './NFTPreview';

const StyledCardContent = styled(CardContent)``;

const MultipleSelectionCheckmark = styled.div`
  position: absolute;
  right: 11px;
  top: 11px;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  display: none;
  background: #fff;
  z-index: 3;
`;

const MultipleSelectionEmptyCheckmark = styled.div`
  position: absolute;
  right: 11px;
  top: 11px;
  border: 2px solid #555;
  width: 18px;
  height: 18px;
  z-index: 6;
  line-height: 22px;
  text-align: center;
  display: none;
  border-radius: 2px;
  display: none;
  background: #fff;
`;

const CardWrapper = styled(Card)`
  box-sizing: border-box;
`;

const ClickableCardTop = styled.div`
  position: absolute;
  z-index: 3;
  height: 50px;
  width: 100%;
`;

export type NFTCardProps = {
  nft: NFTInfo;
  canExpandDetails: boolean;
  availableActions: NFTContextualActionTypes;
  isOffer: boolean;
  selectedItemAction?: (nft: NFTInfo) => void;
};

export default function NFTCard(props: NFTCardProps) {
  const {
    nft,
    canExpandDetails = true,
    availableActions = NFTContextualActionTypes.None,
    isOffer,
    selectedItemAction,
  } = props;

  const { metadata, isLoading } = useNFTMetadata(nft.$nftId);

  const navigate = useNavigate();

  function handleClick() {
    if (selectedItemAction) {
      selectedItemAction(nft.$nftId);
    } else if (canExpandDetails) {
      navigate(`/dashboard/nfts/${nft.$nftId}`);
    }
  }

  return (
    <Flex flexDirection="column" flexGrow={1}>
      <CardWrapper sx={{ borderRadius: '8px' }} variant="outlined" className="card-wrapper">
        <CardActionArea onClick={handleClick}>
          <ClickableCardTop onClick={handleClick} />
          <MultipleSelectionCheckmark className="multiple-selection-checkmark">
            <CheckIcon />
          </MultipleSelectionCheckmark>
          <MultipleSelectionEmptyCheckmark className="multiple-selection-empty" />
          <NFTPreview nft={nft} isPreview disableInteractions={isOffer} />
        </CardActionArea>
        <CardActionArea onClick={() => canExpandDetails && handleClick()} component="div">
          <StyledCardContent>
            <Flex justifyContent="space-between" alignItems="center">
              <Flex gap={1} alignItems="center" minWidth={0}>
                <Typography noWrap>
                  {isLoading ? <Trans>Loading...</Trans> : metadata?.name ?? <Trans>Title Not Available</Trans>}
                </Typography>
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
      </CardWrapper>
    </Flex>
  );
}
