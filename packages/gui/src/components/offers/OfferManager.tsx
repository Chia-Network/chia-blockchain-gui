import { OfferTradeRecord } from '@chia-network/api';
import { useCancelOfferMutation, useGetWalletsQuery } from '@chia-network/api-react';
import {
  Button,
  Card,
  CardHero,
  Flex,
  IconButton,
  LoadingOverlay,
  More,
  TableControlled,
  useOpenDialog,
  useCurrencyCode,
  useSerializedNavigationState,
  Tooltip,
  LayoutDashboardSub,
  MenuItem,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Cancel, GetApp as Download, Info, Reply as Share, Visibility } from '@mui/icons-material';
import { Box, Chip, Grid, ListItemIcon, Typography } from '@mui/material';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import useAssetIdName from '../../hooks/useAssetIdName';
import useSaveOfferFile from '../../hooks/useSaveOfferFile';
import useWalletOffers from '../../hooks/useWalletOffers';
import resolveOfferInfo from '../../util/resolveOfferInfo';
import NotificationNFTTitle from '../notification/NotificationNFTTitle';
import NotificationPreviewNFT from '../notification/NotificationPreviewNFT';
import CreateOfferBuilder from '../offers2/CreateOfferBuilder';
import OfferBuilderImport from '../offers2/OfferBuilderImport';
import OfferBuilderViewer from '../offers2/OfferBuilderViewer';
import OfferIncomingTable from '../offers2/OfferIncomingTable';
import { ConfirmOfferCancellation } from './ConfirmOfferCancellation';
import { CreateNFTOfferEditor } from './NFTOfferEditor';
import NFTOfferViewer from './NFTOfferViewer';
import OfferAsset from './OfferAsset';
import OfferDataDialog from './OfferDataDialog';
import { CreateOfferEditor } from './OfferEditor';
import { OfferImport } from './OfferImport';
import OfferShareDialog from './OfferShareDialog';
import OfferState from './OfferState';
import { colorForOfferState, displayStringForOfferState } from './utils';

function OfferSectionSummaryRow({ displayAmount, displayName, assetType, showNFTs = false }) {
  return (
    <Flex gap={1} alignItems="center">
      {showNFTs && assetType === OfferAsset.NFT ? (
        <div style={{ width: '40px' }}>
          <NotificationPreviewNFT nftId={displayName} size={40} />
        </div>
      ) : null}
      <Flex flexDirection="row" gap={0.5} key={`${displayAmount}-${displayName}`}>
        {assetType === OfferAsset.NFT ? (
          <NotificationNFTTitle nftId={displayName} />
        ) : (
          <Flex flexDirection="row" gap={0.5}>
            <Typography variant="body2">{(displayAmount as any).toString()}</Typography>
            <Typography noWrap variant="body2">
              {displayName}
            </Typography>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

type OfferListProps = {
  title: string | React.ReactElement;
  includeMyOffers: boolean;
  includeTakenOffers: boolean;
};

function OfferList(props: OfferListProps) {
  const { title, includeMyOffers, includeTakenOffers } = props;

  const [cancelOffer] = useCancelOfferMutation();
  const [saveOffer] = useSaveOfferFile();
  const { isLoading: isLoadingWallets } = useGetWalletsQuery();
  const { lookupByAssetId } = useAssetIdName();
  const testnet = useCurrencyCode() === 'TXCH';
  const openDialog = useOpenDialog();
  const { navigate } = useSerializedNavigationState();
  const {
    offers,
    isLoading: isWalletOffersLoading,
    page,
    rowsPerPage,
    count,
    pageChange,
  } = useWalletOffers(5, 0, includeMyOffers, includeTakenOffers, 'RELEVANCE', false);

  const cols = useMemo(() => {
    async function handleShowOfferData(offerData: string) {
      openDialog(<OfferDataDialog offerData={offerData} />);
    }

    async function handleCancelOffer(tradeId: string, canCancelWithTransaction: boolean) {
      const [cancelConfirmed, cancellationOptions] = await openDialog(
        <ConfirmOfferCancellation canCancelWithTransaction={canCancelWithTransaction} />
      );

      if (cancelConfirmed === true) {
        const secure = canCancelWithTransaction ? cancellationOptions.cancelWithTransaction : false;
        const fee = canCancelWithTransaction ? cancellationOptions.cancellationFee : 0;
        await cancelOffer({ tradeId, secure, fee });
      }
    }

    function handleRowClick(event: any, row: OfferTradeRecord) {
      navigate('/dashboard/offers/view', {
        state: {
          referrerPath: '/dashboard/offers',
          offerSummary: row.summary,
          isMyOffer: row.isMyOffer,
          state: row.status,
        },
      });
    }

    async function handleShare(event: any, row: OfferTradeRecord) {
      await openDialog(
        <OfferShareDialog
          offerRecord={row}
          // eslint-disable-next-line no-underscore-dangle -- Can't do anything about it
          offerData={row._offerData}
          exportOffer={() => saveOffer(row.tradeId)}
          testnet={testnet}
        />
      );
    }
    return [
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: OfferTradeRecord) => {
          const { status } = row;

          return (
            <Box onClick={(event) => handleRowClick(event, row)}>
              <Chip label={displayStringForOfferState(status)} variant="outlined" color={colorForOfferState(status)} />
            </Box>
          );
        },
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Status</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const resolvedOfferInfo = resolveOfferInfo(row.summary, 'offered', lookupByAssetId);
          return resolvedOfferInfo.map((info) => (
            <OfferSectionSummaryRow {...info} showNFTs={resolvedOfferInfo.length === 1} />
          ));
        },
        minWidth: '160px',
        title: <Trans>Offered</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const resolvedOfferInfo = resolveOfferInfo(row.summary, 'requested', lookupByAssetId);
          return resolvedOfferInfo.map((info) => (
            <OfferSectionSummaryRow {...info} showNFTs={resolvedOfferInfo.length === 1} />
          ));
        },
        minWidth: '160px',
        title: <Trans>Requested</Trans>,
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: OfferTradeRecord) => {
          const { createdAtTime } = row;

          return (
            <Box onClick={(event) => handleRowClick(event, row)}>
              <Typography color="textSecondary" variant="body2">
                {moment(createdAtTime * 1000).format('LLL')}
              </Typography>
            </Box>
          );
        },
        minWidth: '220px',
        maxWidth: '220px',
        title: <Trans>Creation Date</Trans>,
      },
      {
        // eslint-disable-next-line react/no-unstable-nested-components -- The result is memoized. No performance issue
        field: (row: OfferTradeRecord) => {
          const { tradeId, status } = row;
          const canExport = status === OfferState.PENDING_ACCEPT; // implies isMyOffer === true
          const canDisplayData = status === OfferState.PENDING_ACCEPT;
          const canCancel = status === OfferState.PENDING_ACCEPT || status === OfferState.PENDING_CONFIRM;
          const canShare = status === OfferState.PENDING_ACCEPT;
          const canCancelWithTransaction = canCancel && status === OfferState.PENDING_ACCEPT;

          return (
            <Flex flexDirection="row" justifyContent="center" gap={0}>
              <Flex style={{ width: '32px' }}>
                {canShare && (
                  <Tooltip title={<Trans>Share</Trans>}>
                    <IconButton size="small" disabled={!canShare} onClick={() => handleShare(undefined, row)}>
                      <Share style={{ transform: 'scaleX(-1)' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Flex>
              <Flex style={{ width: '32px' }}>
                <More>
                  <MenuItem onClick={() => handleRowClick(undefined, row)} close>
                    <ListItemIcon>
                      <Info fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="inherit" noWrap>
                      <Trans>Show Details</Trans>
                    </Typography>
                  </MenuItem>
                  {canDisplayData && (
                    // eslint-disable-next-line no-underscore-dangle -- Can't do anything about it
                    <MenuItem onClick={() => handleShowOfferData(row._offerData)} close>
                      <ListItemIcon>
                        <Visibility fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="inherit" noWrap>
                        <Trans>Display Offer Data</Trans>
                      </Typography>
                    </MenuItem>
                  )}
                  {canExport && (
                    <MenuItem onClick={() => saveOffer(tradeId)} close>
                      <ListItemIcon>
                        <Download fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="inherit" noWrap>
                        <Trans>Save Offer File</Trans>
                      </Typography>
                    </MenuItem>
                  )}
                  {canCancel && (
                    <MenuItem onClick={() => handleCancelOffer(tradeId, canCancelWithTransaction)} close>
                      <ListItemIcon>
                        <Cancel fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="inherit" noWrap>
                        <Trans>Cancel Offer</Trans>
                      </Typography>
                    </MenuItem>
                  )}
                </More>
              </Flex>
            </Flex>
          );
        },
        minWidth: '100px',
        maxWidth: '100px',
        title: <Flex justifyContent="center">Actions</Flex>,
      },
    ];
  }, [cancelOffer, lookupByAssetId, navigate, openDialog, saveOffer, testnet]);

  const hasOffers = !!offers?.length;

  return (
    <Card title={title} titleVariant="h6" transparent>
      <LoadingOverlay loading={isWalletOffersLoading || isLoadingWallets}>
        <TableControlled
          rows={offers}
          cols={cols}
          rowsPerPageOptions={[5, 25, 100]}
          count={count}
          rowsPerPage={rowsPerPage}
          pages={hasOffers}
          page={page}
          onPageChange={pageChange}
          isLoading={isWalletOffersLoading}
          caption={
            !hasOffers &&
            !isWalletOffersLoading &&
            !isLoadingWallets && (
              <Typography variant="body2" align="center">
                <Trans>No current offers</Trans>
              </Typography>
            )
          }
        />
      </LoadingOverlay>
    </Card>
  );
}

export function OfferManager() {
  const navigate = useNavigate();

  function handleOfferBuilder() {
    navigate('/dashboard/offers/builder', {
      state: { referrerPath: '/dashboard/offers' },
    });
  }

  return (
    <Flex flexDirection="column" gap={4} alignItems="stretch">
      <Flex gap={4} flexDirection="column">
        <Flex flexDirection="column" gap={1}>
          <Typography variant="h5">
            <Trans>Offer Management</Trans>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <Trans>
              Offers are a way to trade assets in a genuinely peer-to-peer way to eliminate counterparty risk.
            </Trans>
          </Typography>
        </Flex>
        <Box>
          <Grid spacing={4} container>
            <Grid xs={12} md={6} item>
              <Flex flexDirection="column" gap={2} height="100%">
                <Typography variant="h6">
                  <Trans>Create Offer</Trans>
                </Typography>
                <CardHero variant="outlined" fullHeight>
                  <Flex flexDirection="column" gap={4} height="100%">
                    <Flex flexDirection="column" gap={2} flexGrow={1}>
                      <Typography variant="h6">
                        <Trans>Offer Builder</Trans>
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        <Trans>
                          Create a file that you can use to trade XCH, Chia Asset Tokens, or NFTs with no counter-party
                          risk.
                        </Trans>
                      </Typography>
                    </Flex>
                    <Flex justifyContent="flex-end">
                      <Button onClick={handleOfferBuilder} variant="contained" color="primary">
                        <Typography variant="inherit" noWrap>
                          <Trans>Create an Offer</Trans>
                        </Typography>
                      </Button>
                    </Flex>
                  </Flex>
                </CardHero>
              </Flex>
            </Grid>
            <Grid xs={12} md={6} item>
              <Flex flexDirection="column" gap={2} height="100%">
                <Typography variant="h6">
                  <Trans>View Offer</Trans>
                </Typography>
                <OfferBuilderImport />
              </Flex>
            </Grid>
          </Grid>
        </Box>
      </Flex>
      <OfferIncomingTable />
      <OfferList title={<Trans>Offers you created</Trans>} includeMyOffers includeTakenOffers={false} />
      <OfferList title={<Trans>Offers you accepted</Trans>} includeMyOffers={false} includeTakenOffers />
    </Flex>
  );
}

export function CreateOffer() {
  const { getLocationState } = useSerializedNavigationState();
  const locationState = getLocationState(); // For cases where we know that the state has been serialized
  const openDialog = useOpenDialog();
  const [saveOffer] = useSaveOfferFile();
  const testnet = useCurrencyCode() === 'TXCH';

  async function handleOfferCreated(obj: { offerRecord: any; offerData: any }) {
    const { offerRecord, offerData, address } = obj;

    await openDialog(
      <OfferShareDialog
        offerRecord={offerRecord}
        offerData={offerData as string}
        showSuppressionCheckbox
        exportOffer={() => saveOffer(offerRecord.tradeId)}
        testnet={testnet}
        address={address}
      />
    );
  }

  return (
    <LayoutDashboardSub>
      <Routes>
        <Route
          path="builder"
          element={
            <CreateOfferBuilder
              walletType={locationState?.walletType}
              assetId={locationState?.assetId}
              nftId={locationState?.nftId}
              nftIds={locationState?.nftIds}
              nftWalletId={locationState?.nftWalletId}
              referrerPath={locationState?.referrerPath}
              counterOffer={locationState?.counterOffer}
              address={locationState?.address}
              offer={locationState?.offer}
              onOfferCreated={handleOfferCreated}
            />
          }
        />
        <Route
          path="create"
          element={
            <CreateOfferEditor
              walletId={locationState?.walletId}
              walletType={locationState?.walletType}
              referrerPath={locationState?.referrerPath}
              onOfferCreated={handleOfferCreated}
            />
          }
        />
        <Route
          path="create-with-nft"
          element={
            <CreateNFTOfferEditor
              nft={locationState?.nft}
              exchangeType={locationState?.exchangeType}
              referrerPath={locationState?.referrerPath}
              onOfferCreated={handleOfferCreated}
            />
          }
        />
        <Route path="import" element={<OfferImport />} />

        <Route
          path="view-nft"
          element={
            <NFTOfferViewer
              tradeRecord={locationState?.tradeRecord}
              offerData={locationState?.offerData}
              offerSummary={locationState?.offerSummary}
              offerFilePath={locationState?.offerFilePath}
              imported={locationState?.imported}
            />
          }
        />
        <Route
          path="view"
          element={
            <OfferBuilderViewer
              state={locationState?.state}
              isMyOffer={locationState?.isMyOffer}
              offerData={locationState?.offerData}
              offerSummary={locationState?.offerSummary}
              offerFilePath={locationState?.offerFilePath}
              imported={locationState?.imported}
              referrerPath={locationState?.referrerPath}
            />
          }
        />
        <Route path="manage" element={<OfferManager />} />
        <Route path="/" element={<Navigate to="manage" />} />
      </Routes>
    </LayoutDashboardSub>
  );
}
