import { IconButton, Flex } from '@chia-network/core';
import { MoreVert } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Checkbox, Typography, Box } from '@mui/material';
import React, { useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import useHiddenNFTs from '../../hooks/useHiddenNFTs';
import useNFT from '../../hooks/useNFT';
import useNFTFilter from '../../hooks/useNFTFilter';
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
  userFolder?: string | null;
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
    userFolder,
  } = props;

  const nftId = useMemo(() => getNFTId(id), [id]);
  const [isNFTHidden] = useHiddenNFTs();
  const navigate = useNavigate();

  const filter = useNFTFilter();

  const [, setMouseDownState] = React.useState(false);
  const [dragState, setDragState] = React.useState(false);

  const draggableContainerRef = React.useRef<HTMLDivElement | null>(null);

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

  function renderCard() {
    return (
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
          <NFTPreview id={nftId} disableInteractions={isOffer} preview />
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
    );
  }

  const widthBeforeDrag = React.useRef<number | null>(null);
  const heightBeforeDrag = React.useRef<number | null>(null);

  function renderPortal() {
    return createPortal(
      <Box
        id="draggable-card"
        sx={{
          position: 'absolute',
          zIndex: '1000',
          width: `${widthBeforeDrag.current}px`,
          height: `${heightBeforeDrag.current}px`,
          transform: 'scale(0.5)',
          opacity: isHidden ? 1 : 0.6,
        }}
      >
        {renderCard()}
      </Box>,
      document.getElementById('portal') as HTMLElement
    );
  }

  const startPositionLeft = React.useRef<number | undefined>();
  const startPositionTop = React.useRef<number | undefined>();
  const draggingInterval = React.useRef<any | undefined>();
  const countDownSpeed = React.useRef<number | undefined>(30); /* less is faster */
  const countDown = React.useRef<number | undefined>(countDownSpeed.current);

  const mouseMoveEvent = React.useCallback(
    (e: any) => {
      if (!dragState) {
        setDragState(true);
        if (!draggingInterval.current) {
          draggingInterval.current = setInterval(() => {
            countDown.current--;
            if (document.getElementById('draggable-card')) {
              adjustPositionBeforeAdjusted(e);
            }
            if (countDown.current === 1) {
              clearInterval(draggingInterval.current);
            }
          }, 1);
        }
      }
      if (document.getElementById('draggable-card')) {
        if (countDown.current === 1) {
          (document.getElementById('draggable-card') as HTMLElement).style.left = `${
            e.pageX - (widthBeforeDrag.current || 0) / 4 + 10
          }px`;
          (document.getElementById('draggable-card') as HTMLElement).style.top = `${e.pageY - 81}px`;
        } else {
          adjustPositionBeforeAdjusted(e);
        }
      }
    },
    [dragState]
  );

  const mouseUpEvent = React.useCallback(() => {
    setTimeout(() => {
      document.body.removeEventListener('mouseup', mouseUpEvent);
    }, 0);
    document.body.removeEventListener('mousemove', mouseMoveEvent);
    setMouseDownState(false);
    setDragState(false);
    filter.setDraggedNFT(null);
    countDown.current = countDownSpeed.current;
    if (draggingInterval.current) {
      clearInterval(draggingInterval.current);
      draggingInterval.current = null;
    }
  }, [filter, mouseMoveEvent]);

  function adjustPositionBeforeAdjusted(e: any) {
    (document.getElementById('draggable-card') as HTMLElement).style.left = `${
      e.pageX +
      ((startPositionLeft.current - e.pageX) * countDown.current) / countDownSpeed.current -
      (widthBeforeDrag.current || 0) / 4 +
      10
    }px`;
    (document.getElementById('draggable-card') as HTMLElement).style.top = `${
      e.pageY + ((startPositionTop.current - e.pageY) * countDown.current) / countDownSpeed.current - 81
    }px`;
  }

  const mouseDownEvent = React.useCallback(
    (e: MouseEvent) => {
      /* drag and drop to folders */
      if (userFolder) return;
      const rect = (draggableContainerRef.current as HTMLElement).getBoundingClientRect();
      if (!startPositionLeft.current) startPositionLeft.current = rect.left;
      if (!startPositionTop.current) startPositionTop.current = rect.top;
      heightBeforeDrag.current = rect.height;
      widthBeforeDrag.current = rect.width;
      e.preventDefault();
      setMouseDownState(true);
      document.body.addEventListener('mouseup', mouseUpEvent);
      document.body.addEventListener('mousemove', mouseMoveEvent);
      filter.setDraggedNFT(nftId);
      countDown.current = countDownSpeed.current;
    },
    [userFolder, nftId, mouseUpEvent, mouseMoveEvent, filter]
  );

  return (
    <Flex flexDirection="column" flexGrow={1} onMouseDown={mouseDownEvent}>
      <div ref={draggableContainerRef}>
        {dragState && renderPortal()}
        {renderCard()}
      </div>
    </Flex>
  );
}

export default memo(NFTCard);
