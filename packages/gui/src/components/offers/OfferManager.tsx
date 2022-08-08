import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, t } from '@lingui/macro';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonLoading,
  Card,
  CardHero,
  DropdownActions,
  type DropdownActionsChildProps,
  Fee,
  Flex,
  Form,
  IconButton,
  LoadingOverlay,
  More,
  TableControlled,
  TooltipIcon,
  useOpenDialog,
  chiaToMojo,
  useCurrencyCode,
  useSerializedNavigationState,
  useShowSaveDialog,
  Tooltip,
  LayoutDashboardSub,
} from '@chia/core';
import { OfferSummaryRecord, OfferTradeRecord } from '@chia/api';
import {
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  ListItemIcon,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  Cancel,
  GetApp as Download,
  Info,
  Reply as Share,
  Visibility,
} from '@mui/icons-material';
import { Offers } from '@chia/icons';
import {
  useCancelOfferMutation,
  useGetOfferDataMutation,
  useGetWalletsQuery,
} from '@chia/api-react';
import {
  colorForOfferState,
  displayStringForOfferState,
  formatAmountForWalletType,
  offerAssetTypeForAssetId,
  offerContainsAssetOfType,
} from './utils';
import { launcherIdToNFTId } from '../../util/nfts';
import useAssetIdName from '../../hooks/useAssetIdName';
import useSaveOfferFile from '../../hooks/useSaveOfferFile';
import useWalletOffers from '../../hooks/useWalletOffers';
import { CreateOfferEditor } from './OfferEditor';
import { CreateNFTOfferEditor } from './NFTOfferEditor';
import { OfferImport } from './OfferImport';
import { OfferViewer } from './OfferViewer';
import NFTOfferViewer from './NFTOfferViewer';
import OfferAsset from './OfferAsset';
import OfferDataDialog from './OfferDataDialog';
import OfferShareDialog from './OfferShareDialog';
import OfferState from './OfferState';

type ConfirmOfferCancellationProps = {
  canCancelWithTransaction: boolean;
  onClose: (value: any) => void;
  open: boolean;
};

function ConfirmOfferCancellation(props: ConfirmOfferCancellationProps) {
  const { canCancelWithTransaction, onClose, open } = props;
  const methods = useForm({
    defaultValues: {
      fee: '',
    },
  });
  const [cancelWithTransaction, setCancelWithTransaction] = useState<boolean>(
    canCancelWithTransaction,
  );

  function handleCancel() {
    onClose([false]);
  }

  async function handleConfirm() {
    const { fee: xchFee } = methods.getValues();

    const fee = cancelWithTransaction ? chiaToMojo(xchFee) : new BigNumber(0);

    onClose([true, { cancelWithTransaction, cancellationFee: fee }]);
  }

  return (
    <Dialog
      onClose={handleCancel}
      open={open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        <Trans>Cancel Offer</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <Form methods={methods} onSubmit={handleConfirm}>
            <Flex flexDirection="column" gap={3}>
              <Typography variant="body1">
                <Trans>Are you sure you want to cancel your offer?</Trans>
              </Typography>
              {canCancelWithTransaction && (
                <>
                  <Typography variant="body1">
                    <Trans>
                      If you have already shared your offer file, you may need
                      to submit a transaction to cancel the pending offer. Click
                      "Cancel on blockchain" to submit a cancellation
                      transaction.
                    </Trans>
                  </Typography>
                  <Flex flexDirection="row" gap={3}>
                    <Grid container>
                      <Grid xs={6} item>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="cancelWithTransaction"
                              checked={cancelWithTransaction}
                              onChange={(event) =>
                                setCancelWithTransaction(event.target.checked)
                              }
                            />
                          }
                          label={
                            <>
                              <Trans>Cancel on blockchain</Trans>{' '}
                              <TooltipIcon>
                                <Trans>
                                  Creates and submits a transaction on the
                                  blockchain that cancels the offer
                                </Trans>
                              </TooltipIcon>
                            </>
                          }
                        />
                      </Grid>
                      {cancelWithTransaction && (
                        <Grid xs={6} item>
                          <Fee
                            id="filled-secondary"
                            variant="filled"
                            name="fee"
                            color="secondary"
                            label={<Trans>Fee</Trans>}
                            fullWidth
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Flex>
                </>
              )}
            </Flex>
          </Form>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Flex
          flexDirection="row"
          gap={3}
          style={{ paddingBottom: '8px', paddingRight: '16px' }}
        >
          <Button
            onClick={handleCancel}
            color="secondary"
            variant="outlined"
            autoFocus
          >
            <Trans>Close</Trans>
          </Button>
          <ButtonLoading
            onClick={handleConfirm}
            color="danger"
            variant="contained"
          >
            <Trans>Cancel Offer</Trans>
          </ButtonLoading>
        </Flex>
      </DialogActions>
    </Dialog>
  );
}

ConfirmOfferCancellation.defaultProps = {
  canCancelWithTransaction: true,
  onClose: () => {},
  open: true,
};

function resolveOfferInfo(
  summary: OfferSummaryRecord,
  summaryKey: string,
  lookupByAssetId: (assetId: string) => AssetIdMapEntry | undefined,
) {
  const resolvedOfferInfo = Object.entries(summary[summaryKey]).map(
    ([assetId, amount]) => {
      const assetType = offerAssetTypeForAssetId(assetId, summary);
      const assetIdInfo =
        assetType === OfferAsset.NFT ? undefined : lookupByAssetId(assetId);
      const displayAmount = assetIdInfo
        ? formatAmountForWalletType(amount as number, assetIdInfo.walletType)
        : amount;
      let displayName = '';
      if (assetType === OfferAsset.NFT) {
        displayName = launcherIdToNFTId(assetId);
      } else {
        displayName = assetIdInfo?.displayName ?? t`Unknown CAT`;
      }
      return {
        displayAmount,
        displayName,
      };
    },
  );
  return resolvedOfferInfo;
}

type OfferListProps = {
  title: string | React.ReactElement;
  includeMyOffers: boolean;
  includeTakenOffers: boolean;
};

function OfferList(props: OfferListProps) {
  const { title, includeMyOffers, includeTakenOffers } = props;
  const showSaveDialog = useShowSaveDialog();
  const [getOfferData] = useGetOfferDataMutation();
  const [cancelOffer] = useCancelOfferMutation();
  const [saveOffer] = useSaveOfferFile();
  const { data: wallets, isLoading: isLoadingWallets } = useGetWalletsQuery();
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
  } = useWalletOffers(
    5,
    0,
    includeMyOffers,
    includeTakenOffers,
    'RELEVANCE',
    false,
  );

  async function handleShowOfferData(offerData: string) {
    openDialog(<OfferDataDialog offerData={offerData} />);
  }

  async function handleCancelOffer(
    tradeId: string,
    canCancelWithTransaction: boolean,
  ) {
    const [cancelConfirmed, cancellationOptions] = await openDialog(
      <ConfirmOfferCancellation
        canCancelWithTransaction={canCancelWithTransaction}
      />,
    );

    if (cancelConfirmed === true) {
      const secure = canCancelWithTransaction
        ? cancellationOptions.cancelWithTransaction
        : false;
      const fee = canCancelWithTransaction
        ? cancellationOptions.cancellationFee
        : 0;
      await cancelOffer({ tradeId, secure: secure, fee: fee });
    }
  }

  function handleRowClick(event: any, row: OfferTradeRecord) {
    const navigationPath = offerContainsAssetOfType(row.summary, 'singleton')
      ? '/dashboard/offers/view-nft'
      : '/dashboard/offers/view';

    navigate(navigationPath, {
      state: {
        tradeRecord: row,
      },
    });
  }

  async function handleShare(event: any, row: OfferTradeRecord) {
    await openDialog(
      <OfferShareDialog
        offerRecord={row}
        offerData={row._offerData}
        exportOffer={() => saveOffer(row.tradeId)}
        testnet={testnet}
      />,
    );
  }

  const cols = useMemo(() => {
    return [
      {
        field: (row: OfferTradeRecord) => {
          const { status } = row;

          return (
            <Box onClick={(event) => handleRowClick(event, row)}>
              <Chip
                label={displayStringForOfferState(status)}
                variant="outlined"
                color={colorForOfferState(status)}
              />
            </Box>
          );
        },
        minWidth: '170px',
        maxWidth: '170px',
        title: <Trans>Status</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const resolvedOfferInfo = resolveOfferInfo(
            row.summary,
            'offered',
            lookupByAssetId,
          );
          return resolvedOfferInfo.map((info, index) => (
            <Flex
              flexDirection="row"
              gap={0.5}
              key={`${index}-${info.displayName}`}
            >
              <Typography variant="body2">
                {(info.displayAmount as any).toString()}
              </Typography>
              <Typography noWrap variant="body2">
                {info.displayName}
              </Typography>
            </Flex>
          ));
        },
        minWidth: '160px',
        title: <Trans>Offered</Trans>,
      },
      {
        field: (row: OfferTradeRecord) => {
          const resolvedOfferInfo = resolveOfferInfo(
            row.summary,
            'requested',
            lookupByAssetId,
          );
          return resolvedOfferInfo.map((info, index) => (
            <Flex
              flexDirection="row"
              gap={0.5}
              key={`${index}-${info.displayName}`}
            >
              <Typography variant="body2">
                {(info.displayAmount as any).toString()}
              </Typography>
              <Typography noWrap variant="body2">
                {info.displayName}
              </Typography>
            </Flex>
          ));
        },
        minWidth: '160px',
        title: <Trans>Requested</Trans>,
      },
      {
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
        field: (row: OfferTradeRecord) => {
          const { tradeId, status } = row;
          const canExport = status === OfferState.PENDING_ACCEPT; // implies isMyOffer === true
          const canDisplayData = status === OfferState.PENDING_ACCEPT;
          const canCancel =
            status === OfferState.PENDING_ACCEPT ||
            status === OfferState.PENDING_CONFIRM;
          const canShare = status === OfferState.PENDING_ACCEPT;
          const canCancelWithTransaction =
            canCancel && status === OfferState.PENDING_ACCEPT;

          return (
            <Flex flexDirection="row" justifyContent="center" gap={0}>
              <Flex style={{ width: '32px' }}>
                {canShare && (
                  <Tooltip title={<Trans>Share</Trans>}>
                    <IconButton
                      size="small"
                      disabled={!canShare}
                      onClick={() => handleShare(undefined, row)}
                    >
                      <Share style={{ transform: 'scaleX(-1)' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Flex>
              <Flex style={{ width: '32px' }}>
                <More>
                  {({ onClose }: { onClose: () => void }) => (
                    <Box>
                      <MenuItem
                        onClick={() => {
                          onClose();
                          handleRowClick(undefined, row);
                        }}
                      >
                        <ListItemIcon>
                          <Info fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="inherit" noWrap>
                          <Trans>Show Details</Trans>
                        </Typography>
                      </MenuItem>
                      {canDisplayData && (
                        <MenuItem
                          onClick={() => {
                            onClose();
                            handleShowOfferData(row._offerData);
                          }}
                        >
                          <ListItemIcon>
                            <Visibility fontSize="small" />
                          </ListItemIcon>
                          <Typography variant="inherit" noWrap>
                            <Trans>Display Offer Data</Trans>
                          </Typography>
                        </MenuItem>
                      )}
                      {canExport && (
                        <MenuItem
                          onClick={() => {
                            onClose();
                            saveOffer(tradeId);
                          }}
                        >
                          <ListItemIcon>
                            <Download fontSize="small" />
                          </ListItemIcon>
                          <Typography variant="inherit" noWrap>
                            <Trans>Save Offer File</Trans>
                          </Typography>
                        </MenuItem>
                      )}
                      {canCancel && (
                        <MenuItem
                          onClick={() => {
                            onClose();
                            handleCancelOffer(
                              tradeId,
                              canCancelWithTransaction,
                            );
                          }}
                        >
                          <ListItemIcon>
                            <Cancel fontSize="small" />
                          </ListItemIcon>
                          <Typography variant="inherit" noWrap>
                            <Trans>Cancel Offer</Trans>
                          </Typography>
                        </MenuItem>
                      )}
                    </Box>
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
  }, []);

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

  function handleCreateTokenOffer() {
    navigate('/dashboard/offers/create', {
      state: { referrerPath: '/dashboard/offers' },
    });
  }

  function handleCreateNFTOffer() {
    navigate('/dashboard/offers/create-with-nft', {
      state: { referrerPath: '/dashboard/offers' },
    });
  }

  function handleImportOffer() {
    navigate('/dashboard/offers/import');
  }

  return (
    <Flex flexDirection="column" gap={4}>
      <Flex gap={2} flexDirection="column">
        <Typography variant="h5">
          <Trans>Manage Offers</Trans>
        </Typography>
        <Grid container>
          <Grid xs={12} md={6} lg={5} item>
            <CardHero>
              <Offers color="primary" fontSize="extraLarge" />
              <Typography variant="body1">
                <Trans>
                  Create an offer to exchange assets including XCH, tokens, and
                  NFTs. View an offer to inspect and accept an offer made by
                  another party.
                </Trans>
              </Typography>
              <Grid container spacing={1}>
                <Grid xs={6} item>
                  <DropdownActions label={<Trans>Create an Offer</Trans>}>
                    {({ onClose }: DropdownActionsChildProps) => (
                      <>
                        <MenuItem
                          onClick={() => {
                            onClose();
                            handleCreateTokenOffer();
                          }}
                        >
                          <Typography variant="inherit" noWrap>
                            <Trans>Token Offer</Trans>
                          </Typography>
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            onClose();
                            handleCreateNFTOffer();
                          }}
                        >
                          <Typography variant="inherit" noWrap>
                            <Trans>NFT Offer</Trans>
                          </Typography>
                        </MenuItem>
                      </>
                    )}
                  </DropdownActions>
                </Grid>
                <Grid xs={6} item>
                  <Button
                    onClick={handleImportOffer}
                    variant="outlined"
                    fullWidth
                  >
                    <Trans>View an Offer</Trans>
                  </Button>
                </Grid>
              </Grid>
            </CardHero>
          </Grid>
        </Grid>
      </Flex>
      <OfferList
        title={<Trans>Offers you created</Trans>}
        includeMyOffers={true}
        includeTakenOffers={false}
      />
      <OfferList
        title={<Trans>Offers you accepted</Trans>}
        includeMyOffers={false}
        includeTakenOffers={true}
      />
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
    const { offerRecord, offerData } = obj;

    await openDialog(
      <OfferShareDialog
        offerRecord={offerRecord}
        offerData={offerData as string}
        showSuppressionCheckbox={true}
        exportOffer={() => saveOffer(offerRecord.tradeId)}
        testnet={testnet}
      />,
    );
  }

  return (
    <LayoutDashboardSub>
      <Routes>
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
            <OfferViewer
              tradeRecord={locationState?.tradeRecord}
              offerData={locationState?.offerData}
              offerSummary={locationState?.offerSummary}
              offerFilePath={locationState?.offerFilePath}
              imported={locationState?.imported}
            />
          }
        />
        <Route path="manage" element={<OfferManager />} />
        <Route path="/" element={<Navigate to="manage" />} />
      </Routes>
    </LayoutDashboardSub>
  );
}
