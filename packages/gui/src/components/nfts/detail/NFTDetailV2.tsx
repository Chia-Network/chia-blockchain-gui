import type { NFTInfo } from '@chia-network/api';
import { Flex, LayoutDashboardSub, Loading, useOpenDialog, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  MoreVert,
  ArrowBackIosNew,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { IconButton, Box, Grid, Typography } from '@mui/material';
import React, { useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import useFilteredNFTs from '../../../hooks/useFilteredNFTs';
import useNFT from '../../../hooks/useNFT';
import useNFTMetadata from '../../../hooks/useNFTMetadata';
import { isImage } from '../../../util/utils';
import OfferIncomingTable from '../../offers2/OfferIncomingTable';
import NFTContextualActions, { NFTContextualActionTypes } from '../NFTContextualActions';
import NFTDetails from '../NFTDetails';
import NFTHashStatus from '../NFTHashStatus';
import NFTMetadata from '../NFTMetadata';
import NFTPreview from '../NFTPreview';
import NFTPreviewDialog from '../NFTPreviewDialog';
// import NFTProgressBar from '../NFTProgressBar';
import NFTProperties from '../NFTProperties';
import NFTRankings from '../NFTRankings';
import NFTTitle from '../NFTTitle';

export default function NFTDetail() {
  const { nftId } = useParams();
  if (!nftId) {
    return null;
  }

  return <NFTDetailLoaded nftId={nftId} />;
}

type NFTDetailLoadedProps = {
  nftId: string;
};

function NFTDetailLoaded(props: NFTDetailLoadedProps) {
  const { nftId } = props;
  const openDialog = useOpenDialog();
  const { nft } = useNFT(nftId);
  const { metadata, isLoading: isLoadingMetadata } = useNFTMetadata(nftId);

  const { nfts } = useFilteredNFTs();
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

  function handleShowFullScreen() {
    const uri = nft?.dataUris?.[0];
    if (isImage(uri)) {
      openDialog(<NFTPreviewDialog nft={nft} />);
    }
  }

  /*
  function fetchBinaryContentDone(valid: boolean) {
    setValidationProcessed(true);
    setIsValid(valid);
  }
  */

  function handleGoBack() {
    navigate('/dashboard/nfts');
  }

  return (
    <Flex flexDirection="column" gap={2}>
      <Flex sx={{ bgcolor: 'background.paper' }} justifyContent="center" py={{ xs: 2, sm: 3, md: 5 }} px={3}>
        <Flex flexDirection="column" gap={3} position="relative" maxWidth="1200px" width="100%" justifyContent="center">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Box>
              <IconButton onClick={handleGoBack} sx={{ backgroundColor: 'action.hover' }}>
                <ArrowBackIosNew />
              </IconButton>
            </Box>
            <Box>
              {nfts.length > 1 && (
                <Flex gap={2} alignItems="center">
                  <Tooltip title={<Trans>Previous</Trans>}>
                    <IconButton onClick={() => navigateToDetail(-1)} disabled={position === 0}>
                      <ArrowBackIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={<Trans>Use left and right arrow keys to navigate</Trans>}>
                    <Typography variant="body2">
                      {nfts.length > 1 ? `${position + 1} / ${nfts.length}` : null}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={<Trans>Next</Trans>}>
                    <IconButton onClick={() => navigateToDetail(1)} disabled={isLastPosition}>
                      <ArrowForwardIcon />
                    </IconButton>
                  </Tooltip>
                </Flex>
              )}
            </Box>
            <Box display="flex" justifyContent="flex-end">
              <NFTHashStatus nftId={nftId} />
            </Box>
          </Box>
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
                <Box onClick={handleShowFullScreen} sx={{ cursor: 'pointer' }}>
                  <NFTPreview nft={nft} width="100%" height="412px" fit="contain" />
                </Box>
                {/*
                <NFTProgressBar
                  nftIdUrl={`${nft.$nftId}_${uri}`}
                  setValidateNFT={setValidateNFT}
                  fetchBinaryContentDone={fetchBinaryContentDone}
                />
                */}
              </Flex>
            )}
          </Box>
        </Flex>
      </Flex>
      <LayoutDashboardSub>
        {isLoadingMetadata ? (
          <Flex justifyContent="center" alignItems="center">
            <Loading />
          </Flex>
        ) : (
          <Flex flexDirection="column" gap={2} maxWidth="1200px" width="100%" alignSelf="center" mb={3}>
            <Flex alignItems="center" justifyContent="space-between">
              <Typography variant="h4" overflow="hidden">
                <NFTTitle nftId={nftId} />
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
                      <NFTMetadata path="description" nftId={nftId} />
                    </Typography>
                  </Flex>
                  {metadata?.collection?.name && (
                    <Flex flexDirection="column" gap={1}>
                      <Typography variant="h6">
                        <Trans>Collection</Trans>
                      </Typography>

                      <Typography overflow="hidden">
                        <NFTMetadata path="collection.name" nftId={nftId} />
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
