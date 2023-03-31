import type { NFTInfo } from '@chia-network/api';
import { useLocalStorage } from '@chia-network/api-react';
import { Flex, LayoutDashboardSub, Loading, useOpenDialog, Tooltip, useDarkMode } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { MoreVert, ArrowBackIosNew } from '@mui/icons-material';
import { Box, Grid, Typography, IconButton, Button } from '@mui/material';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import isURL from 'validator/lib/isURL';

import NextIcon from '../../../assets/img/next.svg';
import PreviousIcon from '../../../assets/img/previous.svg';
import useFilteredNFTs from '../../../hooks/useFilteredNFTs';
import useNFT from '../../../hooks/useNFT';
import useNFTMetadata from '../../../hooks/useNFTMetadata';
import { isImage } from '../../../util/utils';
import OfferIncomingTable from '../../offers2/OfferIncomingTable';
import NFTContextualActions, { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTContextualActionsEventEmitter from '../NFTContextualActionsEventEmitter';
import NFTDetails from '../NFTDetails';
import NFTPreview from '../NFTPreview';
import NFTPreviewDialog from '../NFTPreviewDialog';
import NFTProgressBar from '../NFTProgressBar';
import NFTProperties from '../NFTProperties';
import NFTRankings from '../NFTRankings';

export default function NFTDetail() {
  const { nftId } = useParams();
  const { nft, isLoading } = useNFT(nftId);

  return isLoading ? <Loading center /> : <NFTDetailLoaded nft={nft} />;
}

type NFTDetailLoadedProps = {
  nft: NFTInfo;
};

function NFTDetailLoaded(props: NFTDetailLoadedProps) {
  const { nft } = props;
  const nftId = nft.$nftId;
  const openDialog = useOpenDialog();
  const [validationProcessed, setValidationProcessed] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { metadata, isLoading /* , error */ } = useNFTMetadata(nftId);

  const uri = nft?.dataUris?.[0];
  const [contentCache] = useLocalStorage(`content-cache-${nftId}`, {});
  const [validateNFT, setValidateNFT] = useState(false);
  const { nfts } = useFilteredNFTs();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const position = useMemo(() => nfts.findIndex((item: NFTInfo) => item.$nftId === nftId), [nftId, nfts]);
  const isLastPosition = nfts.length === position + 1;

  const navigateToDetail = useCallback(
    (offset: number) => {
      const nextPosition = position + offset;
      if (nextPosition >= 0 && nextPosition < nfts.length) {
        navigate(`/dashboard/nfts/${nfts[nextPosition].$nftId}`);
      }
    },
    [nfts, navigate, position]
  );

  useEffect(
    () => () => {
      const { ipcRenderer } = window as any;
      ipcRenderer.invoke('abortFetchingBinary', uri);
    },
    [uri]
  );

  useEffect(() => {
    function detailKeyPress(e: any) {
      if (e.code === 'ArrowLeft') {
        navigateToDetail(-1);
      }
      if (e.code === 'ArrowRight') {
        navigateToDetail(1);
      }
    }
    document.addEventListener('keyup', detailKeyPress);
    return () => {
      document.removeEventListener('keyup', detailKeyPress);
    };
  }, [navigateToDetail]);

  const ValidateContainer = styled.div`
    padding-top: 25px;
    float: right;
    position: relative;
    top: -25px;
    font-size: 14px;
    white-space: nowrap;
  `;

  const ErrorMessage = styled.div`
    color: red;
  `;

  const LeftRightNavigation = styled.div`
    padding: 30px 0 20px 0;
    text-align: center;
    font-size: 14px;
    display: block;
    > div {
      background: ${() => (isDarkMode ? '#333' : '#fafafa')};
      align-items: center;
      border: 1px solid #e0e0e0;
      padding: 10px 15px 10px 5px;
      border-radius: 8px;
      display: inline-flex;
      > div + div {
        margin-left: 25px;
      }
    }
  `;

  const NavigationButton = styled.div`
    display: inline-flex;
    cursor: pointer;
    user-select: none;
    color: ${() => (isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.6)')};
    > svg {
      margin: 0 10px;
      path {
        stroke: ${() => (isDarkMode ? '#ccc' : 'rgba(0, 0, 0, 0.6)')};
      }
    }
    &.disabled {
      color: ${() => (isDarkMode ? '#666' : 'rgba(0, 0, 0, 0.2)')};
      > svg {
        path {
          stroke: ${() => (isDarkMode ? '#666' : 'rgba(0, 0, 0, 0.6)')};
        }
      }
    }
  `;

  const TypographyStyled = styled(Typography)`
    color: ${() => (isDarkMode ? '#fff' : '#333')};
  `;

  function handleShowFullScreen() {
    if (isImage(uri)) {
      openDialog(<NFTPreviewDialog nft={nft} />);
    }
  }

  function renderValidationState() {
    if (!isURL(uri)) return null;
    if (validateNFT && !validationProcessed) {
      return <Trans>Validating hash...</Trans>;
    }

    if (contentCache.valid || (validationProcessed && isValid)) {
      return <Trans>Hash is validated.</Trans>;
    }
    if (contentCache.valid === false || (validationProcessed && !isValid)) {
      return (
        <ErrorMessage>
          <Trans>Hash mismatch.</Trans>
        </ErrorMessage>
      );
    }
    return (
      <Button
        onClick={() => {
          setValidateNFT(true);
          NFTContextualActionsEventEmitter.emit(`force-reload-${nft.$nftId}`);
        }}
        variant="outlined"
        size="large"
      >
        <Trans>Validate SHA256 SUM</Trans>
      </Button>
    );
  }

  function fetchBinaryContentDone(valid: boolean) {
    setValidationProcessed(true);
    setIsValid(valid);
  }

  function handleGoBack() {
    navigate('/dashboard/nfts');
  }

  return (
    <Flex flexDirection="column" gap={2}>
      <Flex sx={{ bgcolor: 'background.paper' }} justifyContent="center" py={{ xs: 2, sm: 3, md: 7 }} px={3}>
        <Flex position="relative" maxWidth="1200px" width="100%" justifyContent="center">
          <Box
            overflow="hidden"
            alignItems="center"
            justifyContent="center"
            maxWidth="800px"
            alignSelf="center"
            width="100%"
            position="relative"
          >
            {nft && (
              <Flex flexDirection="column">
                <Box sx={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', paddingBottom: '20px' }}>
                  <Tooltip title={<Trans>Use left and right arrow keys to navigate</Trans>}>
                    <TypographyStyled variant="body2">
                      {nfts.length > 1 ? `${position + 1} / ${nfts.length}` : null}
                    </TypographyStyled>
                  </Tooltip>
                </Box>
                <Box onClick={handleShowFullScreen} sx={{ cursor: 'pointer' }}>
                  <NFTPreview nft={nft} width="100%" height="412px" fit="contain" />
                </Box>
                <LeftRightNavigation>
                  <div>
                    <NavigationButton onClick={() => navigateToDetail(-1)} className={position === 0 ? 'disabled' : ''}>
                      <PreviousIcon />
                      <Trans>Previous</Trans>
                    </NavigationButton>
                    <NavigationButton onClick={() => navigateToDetail(1)} className={isLastPosition ? 'disabled' : ''}>
                      <NextIcon />
                      <Trans>Next</Trans>
                    </NavigationButton>
                  </div>
                </LeftRightNavigation>
                <NFTProgressBar
                  nftIdUrl={`${nft.$nftId}_${uri}`}
                  setValidateNFT={setValidateNFT}
                  fetchBinaryContentDone={fetchBinaryContentDone}
                />
              </Flex>
            )}
          </Box>
          <Box position="absolute" left={1} top={1}>
            <IconButton onClick={handleGoBack} sx={{ backgroundColor: 'action.hover' }}>
              <ArrowBackIosNew />
            </IconButton>
          </Box>
          <ValidateContainer>{renderValidationState()}</ValidateContainer>
        </Flex>
      </Flex>
      <LayoutDashboardSub>
        {isLoading ? (
          <Flex justifyContent="center" alignItems="center">
            <Loading />
          </Flex>
        ) : (
          <Flex flexDirection="column" gap={2} maxWidth="1200px" width="100%" alignSelf="center" mb={3}>
            <Flex alignItems="center" justifyContent="space-between">
              <Typography variant="h4" overflow="hidden">
                {metadata?.name ?? <Trans>Title Not Available</Trans>}
              </Typography>
              <NFTContextualActions
                selection={{ items: [nft] }}
                availableActions={NFTContextualActionTypes.All}
                toggle={
                  <IconButton>
                    <MoreVert />
                  </IconButton>
                }
              />
            </Flex>

            <Grid spacing={{ xs: 6, lg: 8 }} container>
              <Grid item xs={12} md={6}>
                <Flex flexDirection="column" gap={3}>
                  <Flex flexDirection="column" gap={1}>
                    <Typography variant="h6">
                      <Trans>Description</Trans>
                    </Typography>

                    <Typography sx={{ whiteSpace: 'pre-line' }} overflow="hidden">
                      {metadata?.description ?? <Trans>Not Available</Trans>}
                    </Typography>
                  </Flex>
                  {metadata?.collection?.name && (
                    <Flex flexDirection="column" gap={1}>
                      <Typography variant="h6">
                        <Trans>Collection</Trans>
                      </Typography>

                      <Typography overflow="hidden">
                        {metadata?.collection?.name ?? <Trans>Not Available</Trans>}
                      </Typography>
                    </Flex>
                  )}
                  {(nft?.editionTotal ?? 0) > 1 && (
                    <Flex flexDirection="column" gap={1}>
                      <Typography variant="h6">
                        <Trans>Edition Number</Trans>
                      </Typography>

                      <Typography>
                        <Trans>
                          {nft.editionNumber} of {nft.editionTotal}
                        </Trans>
                      </Typography>
                    </Flex>
                  )}
                  <NFTProperties attributes={metadata?.attributes} />
                  <NFTRankings attributes={metadata?.attributes} />
                </Flex>
              </Grid>
              <Grid item xs={12} md={6}>
                <NFTDetails nft={nft} metadata={metadata} />
              </Grid>
            </Grid>

            <OfferIncomingTable nftId={nftId} title={<Trans>Offers</Trans>} />
          </Flex>
        )}
      </LayoutDashboardSub>
    </Flex>
  );
}
