import type { NFTInfo } from '@chia-network/api';
import { useGetNFTInfoQuery, useGetNFTWallets, useLocalStorage } from '@chia-network/api-react';
import { Flex, LayoutDashboardSub, Loading, useOpenDialog, Tooltip, useDarkMode } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { MoreVert, ArrowBackIosNew } from '@mui/icons-material';
import { Box, Grid, Typography, IconButton, Button } from '@mui/material';
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import isURL from 'validator/lib/isURL';

import NextIcon from '../../../assets/img/next.svg';
import PreviousIcon from '../../../assets/img/previous.svg';
import useFetchNFTs from '../../../hooks/useFetchNFTs';
import useShownNFTs from '../../../hooks/useShownNFTs';
import { launcherIdFromNFTId } from '../../../util/nfts';
import { isImage } from '../../../util/utils';
import NFTContextualActions, { NFTContextualActionTypes, eventEmitter } from '../NFTContextualActions';
import NFTDetails from '../NFTDetails';
import NFTPreview from '../NFTPreview';
import NFTPreviewDialog from '../NFTPreviewDialog';
import NFTProgressBar from '../NFTProgressBar';
import NFTProperties from '../NFTProperties';
import NFTRankings from '../NFTRankings';

export default function NFTDetail() {
  const { nftId } = useParams();
  const { data: nft, isLoading: isLoadingNFT } = useGetNFTInfoQuery({
    coinId: launcherIdFromNFTId(nftId ?? ''),
  });
  const { wallets: nftWallets, isLoading: isLoadingWallets } = useGetNFTWallets();
  const { nfts, isLoading: isLoadingNFTs } = useFetchNFTs(
    nftWallets.map((wallet: any) => wallet.id),
    { skip: !!isLoadingWallets }
  );

  const localNFT = useMemo(() => {
    if (!nfts || isLoadingNFTs) {
      return undefined;
    }
    return nfts.find((nftItem: NFTInfo) => nftItem.$nftId === nftId);
  }, [nfts, nftId, isLoadingNFTs]);

  const isLoading = isLoadingNFT;

  return isLoading ? <Loading center /> : <NFTDetailLoaded nft={localNFT ?? nft} />;
}

type NFTDetailLoadedProps = {
  nft: NFTInfo;
};

function NFTDetailLoaded(props: NFTDetailLoadedProps) {
  const { nft } = props;
  const nftId = nft.$nftId;
  const openDialog = useOpenDialog();
  const [validationProcessed, setValidationProcessed] = useState(false);
  const nftRef = React.useRef(null);
  const [isValid, setIsValid] = useState(false);
  const [metadata, setMetadata] = React.useState<any>({});

  const uri = nft?.dataUris?.[0];
  const [contentCache] = useLocalStorage(`content-cache-${nftId}`, {});
  const [validateNFT, setValidateNFT] = useState(false);
  const [getVisibleNFTs] = useShownNFTs();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  nftRef.current = nft;

  useEffect(
    () => () => {
      const { ipcRenderer } = window as any;
      ipcRenderer.invoke('abortFetchingBinary', uri);
    },
    [uri]
  );

  const detailPosition = getVisibleNFTs().indexOf(nftId);
  const isLastPosition = getVisibleNFTs().length === detailPosition + 1;
  const navigateToDetail = React.useCallback(
    (offset: number) => {
      if (Array.isArray(getVisibleNFTs())) {
        if (detailPosition >= 0 && detailPosition < getVisibleNFTs().length) {
          navigate(`/dashboard/nfts/${getVisibleNFTs()[detailPosition + offset]}`);
        }
      }
    },
    [getVisibleNFTs, navigate, detailPosition]
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

  useEffect(() => {
    const { ipcRenderer } = window as any;
    ipcRenderer.invoke('abortFetchingBinary', uri);
  }, [uri]);

  const ValidateContainer = styled.div`
    padding-top: 25px;
    text-align: center;
  `;

  const ErrorMessage = styled.div`
    color: red;
  `;

  const LeftRightNavigation = styled.div`
    padding: 30px 0 20px 0;
    text-align: right;
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
          eventEmitter.emit(`force-reload-${nft.$nftId}`);
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
                      {Array.isArray(getVisibleNFTs())
                        ? `${getVisibleNFTs().indexOf(nftId) + 1} / ${getVisibleNFTs().length}`
                        : null}
                    </TypographyStyled>
                  </Tooltip>
                </Box>
                <Box onClick={handleShowFullScreen} sx={{ cursor: 'pointer' }}>
                  <NFTPreview nft={nft} width="100%" height="412px" fit="contain" setNFTCardMetadata={setMetadata} />
                </Box>
                <LeftRightNavigation>
                  <div>
                    <NavigationButton
                      onClick={() => navigateToDetail(-1)}
                      className={detailPosition === 0 ? 'disabled' : ''}
                    >
                      <PreviousIcon />
                      <Trans>Previous</Trans>
                    </NavigationButton>
                    <NavigationButton onClick={() => navigateToDetail(1)} className={isLastPosition ? 'disabled' : ''}>
                      <NextIcon />
                      <Trans>Next</Trans>
                    </NavigationButton>
                  </div>
                </LeftRightNavigation>
                <ValidateContainer>{renderValidationState()}</ValidateContainer>
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
        </Flex>
      </Flex>
      <LayoutDashboardSub>
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

          {/**
          <Flex flexDirection="column" gap={1}>
            <Typography variant="h6">
              <Trans>Item Activity</Trans>
            </Typography>
            <Table cols={cols} rows={metadata.activity} />
          </Flex>
          */}
        </Flex>
      </LayoutDashboardSub>
    </Flex>
  );
}
