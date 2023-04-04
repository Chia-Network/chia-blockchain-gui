import { type NFTInfo } from '@chia-network/api';
import { IconButton, Flex } from '@chia-network/core';
import { MoreVert } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Checkbox, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import useHiddenNFTs from '../../hooks/useHiddenNFTs';
import NFTContextualActions, { NFTContextualActionTypes } from './NFTContextualActions';
import NFTPreview from './NFTPreview';
import NFTTitle from './NFTTitle';

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
  onSelect?: (nftId: string) => Promise<boolean>;
  search?: string;
  selected?: boolean;
};

export default function NFTCard(props: NFTCardProps) {
  const {
    nft,
    canExpandDetails = true,
    availableActions = NFTContextualActionTypes.None,
    isOffer,
    onSelect,
    search,
    selected = false,
  } = props;

  const nftId = nft.$nftId;

  const [isNFTHidden] = useHiddenNFTs();
  const navigate = useNavigate();

  const isHidden = useMemo(() => isNFTHidden(nft.$nftId), [nft.$nftId, isNFTHidden]);

  async function handleClick() {
    if (onSelect) {
      const canContinue = await onSelect(nftId);
      if (!canContinue) {
        return;
      }
    }

    if (canExpandDetails) {
      navigate(`/dashboard/nfts/${nftId}`);
    }
  }

  return (
    <Flex flexDirection="column" flexGrow={1}>
      <Card sx={{ borderRadius: '8px', opacity: isHidden ? 0.5 : 1 }} variant="outlined">
        <CardActionArea onClick={handleClick}>
          <ClickableCardTop onClick={handleClick} />
          {onSelect && (
            <Checkbox
              onClick={() => handleClick()}
              checked={selected}
              size="small"
              sx={{ zIndex: 1, position: 'absolute', right: 2, top: 2 }}
            />
          )}
          <NFTPreview nft={nft} isPreview disableInteractions={isOffer} />
        </CardActionArea>
        <CardActionArea onClick={() => canExpandDetails && handleClick()} component="div">
          <CardContent>
            <Flex justifyContent="space-between" alignItems="center">
              <Flex gap={1} alignItems="center" minWidth={0} flexBasis={0} flexGrow={1}>
                <Typography noWrap>
                  <NFTTitle nftId={nftId} highlight={search} />
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
          </CardContent>
        </CardActionArea>
      </Card>
    </Flex>
  );
}
