import React, { useState } from "react";
import { Plural, Trans, t } from '@lingui/macro';
import {
  ButtonLoading,
  CopyToClipboard,
  DialogActions,
  Flex,
  FormatLargeNumber,
  Link,
  TooltipIcon,
  useOpenDialog,
  useShowError,
} from '@chia/core';
import { OfferTradeRecord } from '@chia/api';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  InputAdornment,
  TextField,
  Typography,
} from '@material-ui/core';
import styled from 'styled-components';
import {
  colorForOfferState,
  displayStringForOfferState,
  formatAmountForWalletType
} from './utils';
import { chia_to_mojo, mojo_to_chia_string, mojo_to_colouredcoin_string } from '../../../util/chia';
import WalletType from '../../../constants/WalletType';
import useAssetIdName from '../../../hooks/useAssetIdName';
import useOpenExternal from "../../../hooks/useOpenExternal";
import { IncomingMessage } from "http";
import { Shell, Remote } from 'electron';

const StyledEditorBox = styled.div`
  padding-left: ${({ theme }) => `${theme.spacing(4)}px`};
  padding-right: ${({ theme }) => `${theme.spacing(4)}px`};
`;

const StyledTitle = styled(Box)`
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
`;

const StyledValue = styled(Box)`
  word-break: break-all;
`;

type OfferMojoAmountProps = {
  mojos: number;
  mojoThreshold?: number
};

function OfferMojoAmount(props: OfferMojoAmountProps): React.ReactElement{
  const { mojos, mojoThreshold } = props;

  return (
    <>
      { mojoThreshold && mojos < mojoThreshold && (
        <Flex flexDirection="row" flexGrow={1} gap={1}>
          (
          <FormatLargeNumber value={mojos} />
          <Box>
            <Plural value={mojos} one="mojo" other="mojos" />
          </Box>
          )
        </Flex>
      )}
    </>
  );
}

OfferMojoAmount.defaultProps = {
  mojos: 0,
  mojoThreshold: 1000000000,  // 1 billion
};

type CommonOfferProps = {
  offerRecord: OfferTradeRecord;
  offerData: string;
};

type CommonDialogProps = {
  open: boolean;
  onClose: (value: boolean) => void;
}

type OfferShareOfferBinDialogProps = CommonOfferProps & CommonDialogProps;

// Posts the offer data to OfferBin and returns a URL to the offer.
async function postToOfferBin(offerData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const remote: Remote = (window as any).remote;
      const request = remote.net.request({
        method: 'POST',
        protocol: 'https:',
        hostname: 'www.offerbin.io',
        port: 443,
        path: '/api/upload',
      });

      request.setHeader('Content-Type', 'application/text');

      request.on('response', (response: IncomingMessage) => {
        if (response.statusCode === 200) {
          console.log('OfferBin upload completed');

          const body = response.read().toString('utf8');
          const { hash } = JSON.parse(body);

          resolve(`https://www.offerbin.io/offer/${hash}`);
        }
        else {
          const error = new Error(`OfferBin upload failed, statusCode=${response.statusCode}, statusMessage=${response.statusMessage}`);
          console.error(error);
          reject(error.message);
        }
      });

      request.on('error', (error: any) => {
        console.error(error);
        reject(error);
      });

      // Upload and finalize the request
      request.write(offerData);
      request.end();
    }
    catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

function OfferShareOfferBinDialog(props: OfferShareOfferBinDialogProps) {
  const { offerRecord, offerData, onClose, open } = props;
  const { lookupByAssetId } = useAssetIdName();
  const openExternal = useOpenExternal();
  const showError = useShowError();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sharedURL, setSharedURL] = React.useState('');

  function handleClose() {
    onClose(false);
  }

  async function handleConfirm() {
    try {
      setIsSubmitting(true);

      const url = await postToOfferBin(offerData);

      console.log("OfferBin URL: " + url);
      setSharedURL(url);
    }
    catch (e) {
      showError(e);
    }
    finally {
      setIsSubmitting(false);
    }
  }

  function OfferSummaryEntry({ assetId, amount, ...rest}: { assetId: string, amount: number }) {
    const assetIdInfo = lookupByAssetId(assetId);
    const displayAmount = assetIdInfo ? formatAmountForWalletType(amount as number, assetIdInfo.walletType) : mojo_to_colouredcoin_string(amount);
    const displayName = assetIdInfo?.displayName ?? t`Unknown CAT`;

    return (
      <Flex flexDirections="row" gap={1}>
        <Typography variant="body1" {...rest}>
          <Flex flexDirection="row" alignItems="center" gap={1}>
            <Typography>{displayAmount} {displayName}</Typography>
            {!(assetIdInfo?.displayName) && (
              <TooltipIcon interactive>
                <Flex flexDirection="column" gap={1}>
                  <StyledTitle>TAIL</StyledTitle>
                  <Flex alignItems="center" gap={1}>
                    <StyledValue>{assetId.toLowerCase()}</StyledValue>
                    <CopyToClipboard value={assetId.toLowerCase()} fontSize="small" />
                  </Flex>
                </Flex>
              </TooltipIcon>
            )}
          </Flex>

        </Typography>
        {assetIdInfo?.walletType === WalletType.STANDARD_WALLET && (
          <Typography variant="body1" color="textSecondary">
            <OfferMojoAmount mojos={amount} />
          </Typography>
        )}
      </Flex>
    );
  }

  if (sharedURL) {
    return (
      <Dialog
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        maxWidth="xs"
        open={open}
        onClose={handleClose}
        fullWidth
      >
        <DialogTitle>
          <Trans>Offer Shared</Trans>
        </DialogTitle>
        <DialogContent dividers>
          <Flex flexDirection="column" gap={3}>
            <TextField
              label={<Trans>OfferBin URL</Trans>}
              value={sharedURL}
              variant="filled"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <CopyToClipboard value={sharedURL} />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
            <Flex>
            <Button
              color="secondary"
              variant="contained"
              onClick={() => openExternal(sharedURL)}
            >
              <Trans>View on OfferBin</Trans>
            </Button>
            </Flex>
          </Flex>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="primary"
            variant="contained"
          >
            <Trans>Close</Trans>
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="sm"
      open={open}
      fullWidth
    >
      <DialogTitle id="alert-dialog-title">
        <Trans>Share on OfferBin</Trans>
      </DialogTitle>
      <DialogContent dividers>
        <Flex flexDirection="column" gap={3}>
          <Typography variant="subtitle1">Your offer:</Typography>
          <StyledEditorBox>
            <Flex flexDirection="column" gap={1}>
              {Object.entries(offerRecord.summary.requested).map(([assetId, amount]) => (
                <OfferSummaryEntry assetId={assetId} amount={amount as number} />
              ))}
            </Flex>
          </StyledEditorBox>
          <Typography variant="subtitle1">In exchange for:</Typography>
          <StyledEditorBox>
            <Flex flexDirection="column" gap={1}>
              {Object.entries(offerRecord.summary.offered).map(([assetId, amount]) => (
                <OfferSummaryEntry assetId={assetId} amount={amount as number} />
              ))}
            </Flex>
          </StyledEditorBox>
        </Flex>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
          variant="contained"
          disabled={isSubmitting}
        >
          <Trans>Cancel</Trans>
        </Button>
        <ButtonLoading
          onClick={handleConfirm}
          color="secondary"
          variant="contained"
          loading={isSubmitting}
        >
          <Trans>Share</Trans>
        </ButtonLoading>
      </DialogActions>
    </Dialog>
  );
}

OfferShareOfferBinDialog.defaultProps = {
  open: false,
  onClose: () => {},
};

type OfferShareDialogProps = CommonOfferProps & CommonDialogProps;

export default function OfferShareDialog(props: OfferShareDialogProps) {
  const { offerRecord, offerData, onClose, open } = props;
  const openDialog = useOpenDialog();
  const openExternal = useOpenExternal();
  const showError = useShowError();

  function handleClose() {
    onClose(false);
  }

  async function handleOfferBin() {
    await openDialog(
      <OfferShareOfferBinDialog offerRecord={offerRecord} offerData={offerData} />
    );
  }

  async function handleKeybase() {
    try {
      const shell: Shell = (window as any).shell;
      await shell.openExternal('keybase://chat/chia_offers#general');
    }
    catch (e) {
      showError(new Error(t`Unable to open Keybase. Install Keybase from https://keybase.io`));
    }
  }

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="md"
      open={open}
    >
      <DialogTitle id="alert-dialog-title">
        <Trans>Share Offer</Trans>
      </DialogTitle>

      <DialogContent dividers>
        <Flex flexDirection="column" gap={3}>
          <Typography variant="subtitle1">Where would you like to share your offer?</Typography>
            <Flex flexDirection="row" gap={3}>
              <Button variant="contained" color="default" onClick={handleOfferBin}>
                OfferBin
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleKeybase}
              >
                <Flex flexDirection="column">
                  Keybase
                </Flex>
              </Button>
              <Button variant="contained" color="secondary" disabled={true}>
                <Flex flexDirection="column">
                  Reddit
                  <Typography variant="caption"><Trans>(Coming Soon)</Trans></Typography>
                </Flex>
              </Button>
          </Flex>
        </Flex>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="primary"
          variant="contained"
        >
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

OfferShareDialog.defaultProps = {
  open: false,
  onClose: () => {},
};
