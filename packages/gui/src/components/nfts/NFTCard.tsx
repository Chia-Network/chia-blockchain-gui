import { IconButton, Flex } from '@chia-network/core';
import { MoreVert } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Checkbox, Typography } from '@mui/material';
import React, { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';

import useHiddenNFTs from '../../hooks/useHiddenNFTs';
import useNFT from '../../hooks/useNFT';
import getNFTId from '../../util/getNFTId';
import NFTContextualActions, { NFTContextualActionTypes } from './NFTContextualActions';
import NFTPreview from './NFTPreview';
import NFTTitle from './NFTTitle';

export type NFTCardProps = {
  id: string;
  canExpandDetails: boolean;
  availableActions: NFTContextualActionTypes;
  isOffer: boolean;
  onSelect?: (nftId: string) => Promise<boolean>;
  search?: string;
  selected?: boolean;
  ratio?: number;
};

function NFTCard(props: NFTCardProps) {
  const {
    id,
    canExpandDetails = true,
    availableActions = NFTContextualActionTypes.None,
    isOffer,
    onSelect,
    search,
    selected = false,
    ratio = 4 / 3,
  } = props;

  const nftId = useMemo(() => getNFTId(id), [id]);

  const [isNFTHidden] = useHiddenNFTs();
  const navigate = useNavigate();

  const { nft, isLoading } = useNFT(nftId);
  const isHidden = useMemo(() => isNFTHidden(nftId), [nftId, isNFTHidden]);

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
    <Flex flexDirection="column" flexGrow={1} minWidth={0}>
      <Card sx={{ borderRadius: '8px', opacity: isHidden ? 0.5 : 1 }} variant="outlined">
        <CardActionArea onClick={handleClick}>
          {onSelect && (
            <Checkbox
              onClick={() => handleClick()}
              checked={selected}
              size="small"
              sx={{ zIndex: 1, position: 'absolute', right: 2, top: 2 }}
            />
          )}
          <NFTPreview id={nftId} disableInteractions={isOffer} ratio={ratio} preview />
        </CardActionArea>
        <CardActionArea onClick={() => canExpandDetails && handleClick()} component="div">
          <CardContent>
            <Flex justifyContent="space-between" alignItems="center">
              <Flex gap={1} alignItems="center" minWidth={0} flexBasis={0} flexGrow={1}>
                <Typography noWrap>
                  <NFTTitle nftId={nftId} highlight={search} />
                </Typography>
              </Flex>
              {!isLoading && availableActions !== NFTContextualActionTypes.None && (
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

export default memo(NFTCard);
