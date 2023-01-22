import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { ButtonLoading, Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import React from 'react';

import { launcherIdFromNFTId } from '../../util/nfts';
import NFTPreview from '../nfts/NFTPreview';

export type NotificationSendDialogProps = {
  nftId: string;
  open?: boolean;
  onClose?: () => void;
};

export default function NotificationSendDialog(props: NotificationSendDialogProps) {
  const { nftId, onClose = () => ({}), open = false, ...rest } = props;
  const launcherId = launcherIdFromNFTId(nftId ?? '');
  const { data: nft } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });
  const [, setMetadata] = React.useState<any>({});

  const nftPreviewContainer = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    backgroundColor: 'action.hover',
    border: '1px solid',
    borderColor: 'divider',
    width: '140px',
    height: '140px',
    padding: '8px',
  };

  function handleClose() {
    onClose(false);
  }

  return (
    <Dialog open={open} onClose={onClose} {...rest}>
      <DialogTitle id="nft-move-dialog-title">
        <Flex flexDirection="row" justifyContent="center" gap={1} paddingTop="20px">
          <Typography variant="h6">
            <Trans>Send an Offer Notification</Trans>
          </Typography>
        </Flex>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" alignItems="center" gap={3}>
          <Box sx={nftPreviewContainer}>
            <NFTPreview nft={nft} disableThumbnail setNFTCardMetadata={setMetadata} />
          </Box>
          <Flex flexDirection="column" alignItems="center" gap={1}>
            <Typography variant="h6">
              <Trans>Message the NFT Holder</Trans>
            </Typography>
            <Typography variant="body1" color="textSecondary">
              <Trans>
                For a small fee, you can message the current NFT holder to let them know about your offer. The message
                cost will be a donation to the NFT holder.
              </Trans>
            </Typography>
          </Flex>
          <DialogContentText id="nft-move-dialog-description">
            <Trans>Would you like to move the specified NFT to a profile?</Trans>
          </DialogContentText>
        </Flex>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" variant="contained">
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
      {/* <NFTPreview nft={nft} width="100%" height="100%" background={StyledNFTPreviewBackground} hideStatusBar /> */}
    </Dialog>
  );
}
