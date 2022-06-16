import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, t } from '@lingui/macro';
import { NFTInfo, WalletType } from '@chia/api';
import type { Wallet } from '@chia/api';
import { useGetWalletsQuery } from '@chia/api-react';
import {
  Button,
  ButtonLoading,
  DropdownActions,
  Fee,
  Flex,
  Form,
  TextField,
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
  Divider,
  ListItemIcon,
  MenuItem,
  Typography,
} from '@mui/material';
import { stripHexPrefix } from '../../util/utils';
import { didToDIDId } from '../../util/dids';
import NFTSummary from './NFTSummary';

/* ========================================================================== */
/*                            DID Profile Dropdown                            */
/* ========================================================================== */

type DIDProfileDropdownProps = {
  walletId?: number;
  onChange?: (walletId?: number) => void;
  defaultTitle?: string | React.ReactElement;
};

export function DIDProfileDropdown(props: DIDProfileDropdownProps) {
  const { walletId, onChange, defaultTitle = t`All Profiles` } = props;
  const { data: wallets, isLoading, error, ...rest } = useGetWalletsQuery();

  const didWallets = useMemo(() => {
    if (!wallets) {
      return [];
    }
    console.log('wallets:');
    console.log(wallets);
    return wallets.filter(
      (wallet: Wallet) => wallet.type === WalletType.DISTRIBUTED_ID,
    );
  }, [wallets]);

  const label = useMemo(() => {
    if (isLoading) {
      return t`Loading...`;
    }

    const wallet = didWallets?.find((wallet: Wallet) => wallet.id === walletId);

    return wallet?.name || defaultTitle;
  }, [wallets, walletId]);

  function handleWalletChange(newWalletId?: number) {
    onChange?.(newWalletId);
  }

  console.log('didWallets:');
  console.log(didWallets);

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
          {(didWallets ?? []).map((wallet: Wallet) => (
            <MenuItem
              key={wallet.id}
              onClick={() => {
                onClose();
                handleWalletChange(wallet.id);
              }}
              selected={wallet.id === walletId}
            >
              <ListItemIcon>
                <PermIdentityIcon />
              </ListItemIcon>
              {wallet.name}
            </MenuItem>
          ))}
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
};

export function NFTMoveToProfileAction(props: NFTMoveToProfileActionProps) {
  const { nft, destination } = props;
  const [isLoading, setIsLoading] = useState(false);
  const openDialog = useOpenDialog();
  const methods = useForm<NFTMoveToProfileFormData>({
    shouldUnregister: false,
    defaultValues: {
      destination: destination || '',
      fee: '',
    },
  });
  const hexDIDId = stripHexPrefix(nft.ownerDid);
  const didId = didToDIDId(hexDIDId);
  const truncatedDID = truncateValue(didId, {});

  function handleProfileSelected(walletId?: number) {
    methods.setValue('destination', walletId?.toString() ?? '');
  }

  async function handleClose() {}

  async function handleSubmit(formData: NFTMoveToProfileFormData) {}

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <Flex flexDirection="column" gap={1}>
          <NFTSummary launcherId={nft.launcherId} />
        </Flex>
        <Flex flexDirection="row" gap={1}>
          <Typography variant="body1" color="textSecondary">
            Current Profile:
          </Typography>
          <Typography variant="body1">
            {nft.ownerDid ? nft.ownerDid : <Trans>None</Trans>}
          </Typography>
        </Flex>
        <Flex
          sx={{
            overflow: 'hidden',
            wordBreak: 'break-all',
            textOverflow: 'ellipsis',
          }}
        >
          <DIDProfileDropdown
            onChange={handleProfileSelected}
            defaultTitle={<Trans>Move to Profile</Trans>}
            variant="outlined"
            color="primary"
          />
        </Flex>
        <TextField
          name="destination"
          variant="filled"
          color="secondary"
          fullWidth
          label={<Trans>Send to Address</Trans>}
          disabled={isLoading}
          required
        />
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
            // onComplete={handleCompletion}
          />
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
