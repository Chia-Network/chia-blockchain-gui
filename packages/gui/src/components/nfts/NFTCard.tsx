import { type NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import { IconButton, Flex } from '@chia-network/core';
import { MoreVert } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Checkbox, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import useHiddenNFTs from '../../hooks/useHiddenNFTs';
import NFTContextualActions, { NFTContextualActionTypes } from './NFTContextualActions';
import NFTPreview from './NFTPreview';
import NFTTitle from './NFTTitle';

export type NFTCardProps = {
  nft: NFTInfo;
  canExpandDetails: boolean;
  availableActions: NFTContextualActionTypes;
  isOffer: boolean;
  onSelect?: (nftId: string) => Promise<boolean>;
  search?: string;
  selected?: boolean;
  userFolder?: string | null;
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
    userFolder,
  } = props;

  const nftId = nft?.$nftId;

  const [isNFTHidden] = useHiddenNFTs();
  const navigate = useNavigate();

  const [, setDraggedNFT] = useLocalStorage<string | null>('dragged-nft', null);

  const [, setMouseDownState] = React.useState(false);
  const [dragState, setDragState] = React.useState(false);

  const draggableContainerRef = React.useRef<HTMLDivElement>(null);

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

  function renderCard() {
    return (
      <Card data-testid={nft.$nftId} sx={{ borderRadius: '8px', opacity: isHidden ? 0.5 : 1 }} variant="outlined">
        <CardActionArea onClick={handleClick}>
          {onSelect && (
            <Checkbox
              onClick={() => handleClick()}
              checked={selected}
              size="small"
              sx={{ zIndex: 1, position: 'absolute', right: 2, top: 2 }}
            />
          )}
          <NFTPreview nft={nft} disableInteractions={isOffer} preview />
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
    );
  }

  const widthBeforeDrag = React.useRef<number | null>(null);
  const heightBeforeDrag = React.useRef<number | null>(null);

  function renderPortal() {
    return createPortal(
      <div
        id="draggable-card"
        style={{
          position: 'absolute',
          zIndex: '1000',
          width: `${widthBeforeDrag.current}px`,
          height: `${heightBeforeDrag.current}px`,
          transform: 'scale(0.5)',
          opacity: isHidden ? 1 : 0.6,
        }}
      >
        {renderCard()}
      </div>,
      document.getElementById('portal') as HTMLElement
    );
  }

  function mouseUpEvent() {
    setTimeout(() => {
      document.body.removeEventListener('mouseup', mouseUpEvent);
    }, 0);
    document.body.removeEventListener('mousemove', mouseMoveEvent);
    setMouseDownState(false);
    setDragState(false);
    setDraggedNFT(null);
  }

  let startPositionLeft: number;
  let startPositionTop: number;
  let draggingInterval: any;
  const countdownSpeed = 30; /* less is faster */
  let countDown: number = countdownSpeed;

  function adjustPositionBeforeAdjusted(e: any) {
    (document.getElementById('draggable-card') as HTMLElement).style.left = `${
      e.pageX + ((startPositionLeft - e.pageX) * countDown) / countdownSpeed - 79
    }px`;
    (document.getElementById('draggable-card') as HTMLElement).style.top = `${
      e.pageY + ((startPositionTop - e.pageY) * countDown) / countdownSpeed - 81
    }px`;
  }

  function mouseMoveEvent(e: any) {
    if (!dragState) {
      setDragState(true);
      if (!draggingInterval) {
        draggingInterval = setInterval(() => {
          countDown--;
          if (document.getElementById('draggable-card')) {
            adjustPositionBeforeAdjusted(e);
          }
          if (countDown === 1) {
            clearInterval(draggingInterval);
          }
        }, 1);
      }
    }
    if (document.getElementById('draggable-card')) {
      if (countDown === 1) {
        (document.getElementById('draggable-card') as HTMLElement).style.left = `${e.pageX - 79}px`;
        (document.getElementById('draggable-card') as HTMLElement).style.top = `${e.pageY - 81}px`;
      } else {
        adjustPositionBeforeAdjusted(e);
      }
    }
  }

  return (
    <Flex
      flexDirection="column"
      flexGrow={1}
      onMouseDown={(e: MouseEvent) => {
        /* drag and drop to folders */
        if (userFolder) return;
        const rect = (draggableContainerRef.current as HTMLElement).getBoundingClientRect();
        if (!startPositionLeft) startPositionLeft = rect.left;
        if (!startPositionTop) startPositionTop = rect.top;
        heightBeforeDrag.current = rect.height;
        widthBeforeDrag.current = rect.width;
        e.preventDefault();
        setMouseDownState(true);
        document.body.addEventListener('mouseup', mouseUpEvent);
        document.body.addEventListener('mousemove', mouseMoveEvent);
        setDraggedNFT(nft.$nftId);
        countDown = countdownSpeed;
      }}
    >
      <div ref={draggableContainerRef}>
        {dragState && renderPortal()}
        {renderCard()}
      </div>
    </Flex>
  );
}
