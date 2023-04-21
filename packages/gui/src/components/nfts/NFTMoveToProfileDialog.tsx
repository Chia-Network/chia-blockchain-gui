import { NFTInfo } from '@chia-network/api';
import type { Wallet } from '@chia-network/api';
import { useGetDIDsQuery, useGetNFTWallets, useSetNFTDIDMutation, useLocalStorage } from '@chia-network/api-react';
import {
  AlertDialog,
  Button,
  ButtonLoading,
  ConfirmDialog,
  CopyToClipboard,
  EstimatedFee,
  FeeTxType,
  Flex,
  Form,
  TooltipIcon,
  chiaToMojo,
  truncateValue,
  useOpenDialog,
  useShowError,
} from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';

import { didToDIDId } from '../../util/dids';
import removeHexPrefix from '../../util/removeHexPrefix';
import DIDProfileDropdown from '../did/DIDProfileDropdown';
import NFTSummary from './NFTSummary';
import { getNFTInbox } from './utils';

/* ========================================================================== */

const StyledValue = styled(Box)`
  word-break: break-all;
`;

const ErrorTextWrapper = styled.div`
  > div + div {
    margin-top: 15px;
  }
`;

/* ========================================================================== */
/*                     Move to Profile Confirmation Dialog                    */
/* ========================================================================== */

type NFTMoveToProfileConfirmationDialogProps = {};

function NFTMoveToProfileConfirmationDialog(props: NFTMoveToProfileConfirmationDialogProps) {
  const { ...rest } = props;

  return (
    <ConfirmDialog
      title={<Trans>Confirm Move</Trans>}
      confirmTitle={<Trans>Yes, move</Trans>}
      confirmColor="secondary"
      cancelTitle={<Trans>Cancel</Trans>}
      {...rest}
    >
      <Flex flexDirection="column" gap={3}>
        <Typography variant="body1">
          <Trans>Are you sure you want to move this NFT to the specified profile?</Trans>
        </Typography>
      </Flex>
    </ConfirmDialog>
  );
}

/* ========================================================================== */
/*                         NFT Move to Profile Action                         */
/* ========================================================================== */

type NFTMoveToProfileFormData = {
  destination: string;
  fee: string;
};

type NFTMoveToProfileActionProps = {
  nfts: NFTInfo[];
  destination?: string;
  onComplete?: () => void;
};

export function NFTMoveToProfileAction(props: NFTMoveToProfileActionProps) {
  const { nfts, destination: defaultDestination, onComplete } = props;

  const [setNFTDID, { isLoading: isSetNFTDIDLoading }] = useSetNFTDIDMutation();
  const openDialog = useOpenDialog();
  const errorDialog = useShowError();
  const methods = useForm<NFTMoveToProfileFormData>({
    shouldUnregister: false,
    defaultValues: {
      destination: defaultDestination || '',
      fee: '',
    },
  });
  const destination = methods.watch('destination');
  const { data: didWallets, isLoading: isLoadingDIDs } = useGetDIDsQuery();
  const { wallets: nftWallets, isLoading: isLoadingNFTWallets } = useGetNFTWallets();
  const currentDIDId = nfts[0].ownerDid ? didToDIDId(removeHexPrefix(nfts[0].ownerDid)) : undefined;
  const [, setSelectedNFTIds] = useLocalStorage('gallery-selected-nfts', []);

  const inbox: Wallet | undefined = useMemo(() => {
    if (isLoadingNFTWallets) {
      return undefined;
    }

    return getNFTInbox(nftWallets);
  }, [nftWallets, isLoadingNFTWallets]);

  const currentDID = useMemo(() => {
    if (!didWallets || !currentDIDId) {
      return undefined;
    }

    return didWallets.find((wallet: Wallet) => wallet.myDid === currentDIDId);
  }, [didWallets, currentDIDId]);

  const newDID = destination ? didWallets.find((wallet: Wallet) => wallet.myDid === destination) : undefined;

  let newProfileName;
  if (newDID) {
    newProfileName = newDID.name;

    if (!newProfileName) {
      newProfileName = truncateValue(newDID.myDid, {});
    }
  } else if (destination === '<none>') {
    newProfileName = t`None`;
  }

  function handleProfileSelected(walletId?: number) {
    if (!walletId) {
      methods.setValue('destination', '<none>');
    } else {
      const selectedWallet = didWallets.find((wallet: Wallet) => wallet.id === walletId);
      methods.setValue('destination', selectedWallet?.myDid || '');
    }
  }

  async function handleClose() {
    if (onComplete) {
      onComplete();
    }
  }

  async function handleSubmit(formData: NFTMoveToProfileFormData) {
    const { destination: destinationLocal, fee } = formData;
    const feeInMojos = chiaToMojo(fee || 0);
    let isValid = true;

    if (!destinationLocal || destinationLocal === currentDIDId) {
      errorDialog(new Error(t`Please select a profile to move the NFT to.`));
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const destinationDID = destinationLocal === '<none>' ? undefined : destinationLocal;

    const confirmation = await openDialog(<NFTMoveToProfileConfirmationDialog />);

    if (confirmation) {
      try {
        const { error, data: response } = await setNFTDID({
          walletId: nfts[0].walletId,
          nftCoinIds: nfts.map((nft) => removeHexPrefix(nft.nftCoinId)),
          did: destinationDID,
          fee: feeInMojos,
        });

        // TODO: this condition is never triggered, since the mutation never returns array
        if (Array.isArray(response)) {
          const successTransfers = response.filter((r: any) => r?.success === true);
          const failedTransfers = response.filter((r: any) => r?.success !== true);
          setSelectedNFTIds([]);
          openDialog(
            <AlertDialog title={<Trans>NFT Move Pending</Trans>}>
              <ErrorTextWrapper>
                <div>
                  <Trans
                    id="{count} transactions have been successfully submitted to the blockchain."
                    values={{ count: successTransfers.length }}
                  />
                </div>
                <div>
                  {failedTransfers.length ? (
                    <Trans id="{count} NFTs failed to move." values={{ count: failedTransfers.length }} />
                  ) : null}
                </div>
              </ErrorTextWrapper>
            </AlertDialog>
          );
        } else if (!error) {
          openDialog(
            <AlertDialog title={<Trans>NFT Move Pending</Trans>}>
              <Trans>The NFT move transaction has been successfully submitted to the blockchain.</Trans>
            </AlertDialog>
          );
        } else {
          const err = error?.message || 'Unknown error';
          openDialog(
            <AlertDialog title={<Trans>NFT Move Failed</Trans>}>
              <Trans>The NFT move failed: {err}</Trans>
            </AlertDialog>
          );
        }
      } finally {
        if (onComplete) {
          onComplete();
        }
      }
    }
  }

  function renderNftPreview() {
    if (nfts.length === 1) {
      return (
        <Flex flexDirection="column" gap={1}>
          <NFTSummary launcherId={nfts[0].launcherId} />
        </Flex>
      );
    }
    return null;
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        {renderNftPreview()}
        <Flex
          sx={{
            overflow: 'hidden',
            wordBreak: 'break-all',
            textOverflow: 'ellipsis',
          }}
        >
          <DIDProfileDropdown
            walletId={currentDID ? currentDID.id : undefined}
            onChange={handleProfileSelected}
            defaultTitle={<Trans>Select Profile</Trans>}
            currentDID={currentDIDId}
            includeNoneOption={inbox !== undefined && currentDIDId !== undefined}
            variant="outlined"
            color="primary"
            disabled={isSetNFTDIDLoading || isLoadingDIDs || isLoadingNFTWallets}
          />
        </Flex>
        <Flex flexDirection="column" gap={2}>
          <Flex flexDirection="row" alignItems="center" gap={1}>
            <Flex>
              <Typography variant="body1" color="textSecondary" noWrap>
                Current Profile:
              </Typography>
            </Flex>
            <Flex
              flexShrink={1}
              sx={{
                overflow: 'hidden',
                wordBreak: 'break-all',
                textOverflow: 'ellipsis',
              }}
            >
              <Typography variant="body1" noWrap>
                {currentDID
                  ? currentDID.name
                    ? currentDID.name
                    : currentDID.myDid
                  : currentDIDId || <Trans>None</Trans>}
              </Typography>
            </Flex>
            {currentDIDId && (
              <TooltipIcon>
                <Flex alignItems="center" gap={1}>
                  <StyledValue>{currentDIDId}</StyledValue>
                  <CopyToClipboard value={currentDIDId} fontSize="small" invertColor />
                </Flex>
              </TooltipIcon>
            )}
          </Flex>
          {newProfileName && (
            <Flex flexDirection="row" alignItems="center" gap={1}>
              <Flex>
                <Typography variant="body1" color="textSecondary" noWrap>
                  New Profile:
                </Typography>
              </Flex>
              <Flex
                flexShrink={1}
                sx={{
                  overflow: 'hidden',
                  wordBreak: 'break-all',
                  textOverflow: 'ellipsis',
                }}
              >
                <Typography variant="body1" noWrap>
                  {newProfileName}
                </Typography>
              </Flex>
              {newDID && (
                <TooltipIcon>
                  <Flex alignItems="center" gap={1}>
                    <StyledValue>{newDID.myDid}</StyledValue>
                    <CopyToClipboard value={newDID.myDid} fontSize="small" invertColor />
                  </Flex>
                </TooltipIcon>
              )}
            </Flex>
          )}
        </Flex>
        <EstimatedFee
          id="filled-secondary"
          variant="filled"
          name="fee"
          color="secondary"
          label={<Trans>Fee</Trans>}
          disabled={isSetNFTDIDLoading}
          txType={FeeTxType.assignDIDToNFT}
          fullWidth
        />
        <DialogActions>
          <Flex flexDirection="row" gap={3}>
            <Button onClick={handleClose} color="secondary" variant="outlined" autoFocus>
              <Trans>Close</Trans>
            </Button>
            <ButtonLoading type="submit" autoFocus color="primary" variant="contained" loading={isSetNFTDIDLoading}>
              <Trans>Move</Trans>
            </ButtonLoading>
          </Flex>
        </DialogActions>
      </Flex>
    </Form>
  );
}

/* ========================================================================== */
/*                         NFT Move to Profile Dialog                         */
/* ========================================================================== */

type NFTMoveToProfileDialogProps = {
  open: boolean;
  onClose?: (value: any) => void;
  nfts: NFTInfo[];
  destination?: string;
};

export default function NFTMoveToProfileDialog(props: NFTMoveToProfileDialogProps) {
  const { open, onClose, nfts, destination, ...rest } = props;

  function handleClose() {
    if (onClose) onClose(false);
  }

  function handleCompletion() {
    if (onClose) onClose(true);
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="nft-move-dialog-title"
      aria-describedby="nft-move-dialog-description"
      maxWidth="sm"
      fullWidth
      {...rest}
    >
      <DialogTitle id="nft-move-dialog-title">
        <Flex flexDirection="row" gap={1}>
          <Typography variant="h6">
            <Trans>Move NFT to Profile</Trans>
          </Typography>
        </Flex>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" gap={3}>
          <DialogContentText id="nft-move-dialog-description">
            {nfts.length > 1 ? (
              <Trans id="Would you like to move {count} NFTs to a profile?" values={{ count: nfts.length }} />
            ) : (
              <Trans>Would you like to move the specified NFT to a profile?</Trans>
            )}
          </DialogContentText>
          <NFTMoveToProfileAction nfts={nfts} destination={destination} onComplete={handleCompletion} />
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
