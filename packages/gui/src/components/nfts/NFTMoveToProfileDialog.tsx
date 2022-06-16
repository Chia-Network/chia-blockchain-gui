import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, t } from '@lingui/macro';
import { NFTInfo } from '@chia/api';
import type { Wallet } from '@chia/api';
import {
  useGetDIDsQuery,
  useGetNFTWallets,
  useSetNFTDIDMutation,
} from '@chia/api-react';
import {
  Button,
  ButtonLoading,
  CopyToClipboard,
  DropdownActions,
  Fee,
  Flex,
  Form,
  TooltipIcon,
  truncateValue,
  useOpenDialog,
} from '@chia/core';
import { PermIdentity as PermIdentityIcon } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemIcon,
  MenuItem,
  Typography,
} from '@mui/material';
import { stripHexPrefix } from '../../util/utils';
import { didToDIDId } from '../../util/dids';
import NFTSummary from './NFTSummary';
import styled from 'styled-components';

/* ========================================================================== */

const StyledValue = styled(Box)`
  word-break: break-all;
`;

/* ========================================================================== */
/*                            DID Profile Dropdown                            */
/* ========================================================================== */

type DIDProfileDropdownProps = {
  walletId?: number;
  onChange?: (walletId?: number) => void;
  defaultTitle?: string | React.ReactElement;
  excludeDIDs?: string[];
  includeNoneOption?: boolean;
};

export function DIDProfileDropdown(props: DIDProfileDropdownProps) {
  const {
    walletId,
    onChange,
    defaultTitle = t`All Profiles`,
    excludeDIDs = [],
    includeNoneOption = false,
    ...rest
  } = props;
  const { data: allDIDWallets, isLoading } = useGetDIDsQuery();

  const didWallets = useMemo(() => {
    if (!allDIDWallets) {
      return [];
    }

    return allDIDWallets.filter(
      (wallet: Wallet) => !excludeDIDs.includes(wallet.myDid),
    );
  }, [allDIDWallets, excludeDIDs]);

  console.log('didWallets:');
  console.log(didWallets);

  const label = useMemo(() => {
    if (isLoading) {
      return t`Loading...`;
    }

    const wallet = didWallets?.find((wallet: Wallet) => wallet.id === walletId);

    return wallet?.name || defaultTitle;
  }, [didWallets, walletId]);

  function handleWalletChange(newWalletId?: number) {
    onChange?.(newWalletId);
  }

  return (
    <DropdownActions
      onSelect={handleWalletChange}
      label={label}
      variant="text"
      color="secondary"
      size="large"
      {...rest}
    >
      {({ onClose }: { onClose: () => void }) => (
        <>
          {(didWallets ?? []).map((wallet: Wallet, index) => (
            <MenuItem
              key={wallet.id}
              onClick={() => {
                onClose();
                handleWalletChange(wallet.id);
              }}
              selected={wallet.id === walletId}
              divider={index === didWallets?.length - 1 && includeNoneOption}
            >
              <ListItemIcon>
                <PermIdentityIcon />
              </ListItemIcon>
              {wallet.name}
            </MenuItem>
          ))}
          {includeNoneOption && (
            <MenuItem
              key={'<none>'}
              onClick={() => {
                onClose();
                handleWalletChange();
              }}
              selected={!walletId}
            >
              <ListItemIcon>
                <PermIdentityIcon />
              </ListItemIcon>
              <Trans>None</Trans>
            </MenuItem>
          )}
        </>
      )}
    </DropdownActions>
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
  nft: NFTInfo;
  destination?: string;
  onComplete?: () => void;
};

export function NFTMoveToProfileAction(props: NFTMoveToProfileActionProps) {
  const { nft, destination: defaultDestination, onComplete } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [setNFTDID] = useSetNFTDIDMutation();
  const openDialog = useOpenDialog();
  const methods = useForm<NFTMoveToProfileFormData>({
    shouldUnregister: false,
    defaultValues: {
      destination: defaultDestination || '',
      fee: '',
    },
  });
  const destination = methods.watch('destination');
  const { data: didWallets, isLoading: isLoadingDIDs } = useGetDIDsQuery();
  const { wallets: nftWallets, isLoading: isLoadingNFTWallets } =
    useGetNFTWallets();
  const currentDIDId = nft.ownerDid
    ? didToDIDId(stripHexPrefix(nft.ownerDid))
    : undefined;

  const inbox: Wallet | undefined = useMemo(() => {
    if (isLoadingDIDs || isLoadingNFTWallets) {
      return undefined;
    }

    const nftWalletIds: number[] = nftWallets.map(
      (nftWallet: Wallet) => nftWallet.walletId,
    );
    const didWalletIds = new Set(
      didWallets.map((wallet: Wallet) => wallet.nftWalletId),
    );
    const inboxWalletId = nftWalletIds.find(
      (nftWalletId) => !didWalletIds.has(nftWalletId),
    );
    return nftWallets.find(
      (wallet: Wallet) => wallet.walletId === inboxWalletId,
    );
  }, [didWallets, nftWallets, isLoadingDIDs, isLoadingNFTWallets]);

  const currentDID = useMemo(() => {
    if (!didWallets || !currentDIDId) {
      return undefined;
    }

    return didWallets.find((wallet: Wallet) => wallet.myDid === currentDIDId);
  }, [didWallets, currentDIDId]);

  console.log('destination:');
  console.log(destination);

  const newDID = destination
    ? didWallets.find((wallet: Wallet) => wallet.myDid === destination)
    : undefined;

  console.log('newDID:');
  console.log(newDID);

  console.log('inbox');
  console.log(inbox);

  let newProfileName = undefined;
  if (newDID) {
    newProfileName = newDID.name;

    if (!newProfileName) {
      newProfileName = truncateValue(newDID.myDid, {});
    }
  }

  function handleProfileSelected(walletId?: number) {
    if (!walletId) {
      methods.setValue('destination', '<none>');
    } else {
      const selectedWallet = didWallets.find(
        (wallet: Wallet) => wallet.id === walletId,
      );
      methods.setValue('destination', selectedWallet?.myDid || '');
    }
  }

  async function handleClose() {
    if (onComplete) {
      onComplete();
    }
  }

  async function handleSubmit(formData: NFTMoveToProfileFormData) {
    const { destination, fee } = formData;
    let isValid = true;
    let confirmation = false;

    if (isValid) {
      confirmation = await openDialog();
      // <NFTMoveToProfileConfirmationDialog destination={destination} fee={fee} />,
    }

    if (confirmation) {
      setIsLoading(true);

      const { error, data: response } = await setNFTDID({
        walletId: nft.walletId,
        nftCoinId: nft.nftCoinId,
        launcherId: nft.launcherId,
        targetAddress: destination,
        fee: fee,
      });
      const success = response?.success ?? false;
      const errorMessage = error ?? undefined;

      setIsLoading(false);

      if (onComplete) {
        onComplete({
          success,
          transferInfo: {
            nftAssetId: nft.nftCoinId,
            destination,
            fee,
          },
          error: errorMessage,
        });
      }
    }
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <Flex flexDirection="column" gap={1}>
          <NFTSummary launcherId={nft.launcherId} />
        </Flex>
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
            defaultTitle={<Trans>Move to Profile</Trans>}
            excludeDIDs={currentDIDId ? [currentDIDId] : []}
            includeNoneOption={inbox !== undefined}
            variant="outlined"
            color="primary"
          />
        </Flex>
        <Flex flexDirection="column" gap={2}>
          <Flex flexDirection="row" alignItems="center" gap={1}>
            <Flex flexGrow={1}>
              <Typography variant="body1" color="textSecondary" noWrap>
                Current Profile:
              </Typography>
            </Flex>
            <Flex
              sx={{
                overflow: 'hidden',
                wordBreak: 'break-all',
                textOverflow: 'ellipsis',
              }}
            >
              <Typography variant="body1" noWrap>
                {currentDID ? (
                  currentDID.name ? (
                    currentDID.name
                  ) : (
                    currentDID.myDid
                  )
                ) : (
                  <Trans>None</Trans>
                )}
              </Typography>
            </Flex>
            <TooltipIcon interactive>
              <Flex alignItems="center" gap={1}>
                <StyledValue>{currentDIDId}</StyledValue>
                <CopyToClipboard value={currentDIDId} fontSize="small" />
              </Flex>
            </TooltipIcon>
          </Flex>
          {newProfileName && (
            <Flex flexDirection="row" alignItems="center" gap={1}>
              <Flex flexGrow={1}>
                <Typography variant="body1" color="textSecondary" noWrap>
                  New Profile:
                </Typography>
              </Flex>
              <Flex
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
              <TooltipIcon interactive>
                <Flex alignItems="center" gap={1}>
                  <StyledValue>{newDID.myDid}</StyledValue>
                  <CopyToClipboard value={newDID.myDid} fontSize="small" />
                </Flex>
              </TooltipIcon>
            </Flex>
          )}
        </Flex>
        <Fee
          id="filled-secondary"
          variant="filled"
          name="fee"
          color="secondary"
          label={<Trans>Fee</Trans>}
          disabled={isLoading}
        />
        <DialogActions>
          <Flex flexDirection="row" gap={3}>
            <Button
              onClick={handleClose}
              color="secondary"
              variant="outlined"
              autoFocus
            >
              <Trans>Close</Trans>
            </Button>
            <ButtonLoading
              type="submit"
              autoFocus
              color="primary"
              variant="contained"
              loading={isLoading}
            >
              <Trans>Transfer</Trans>
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
  onClose: (value: any) => void;
  nft: NFTInfo;
  destination?: string;
};

export default function NFTMoveToProfileDialog(
  props: NFTMoveToProfileDialogProps,
) {
  const { open, onClose, nft, destination, ...rest } = props;

  function handleClose() {
    onClose(false);
  }

  function handleCompletion() {
    onClose(true);
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
      <DialogTitle id="nft-transfer-dialog-title">
        <Flex flexDirection="row" gap={1}>
          <Typography variant="h6">
            <Trans>Move NFT to Profile</Trans>
          </Typography>
        </Flex>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" gap={3}>
          <DialogContentText id="nft-transfer-dialog-description">
            <Trans>
              Would you like to move the specified NFT to a profile?
            </Trans>
          </DialogContentText>
          <NFTMoveToProfileAction
            nft={nft}
            destination={destination}
            onComplete={handleCompletion}
          />
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
