import { Flex } from '@chia-network/core';
import { t } from '@lingui/macro';
import { Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import React from 'react';

import SignMessage from './SignMessage';
import VerifyMessage from './VerifyMessage';

export enum SignVerifyDialogMode {
  Sign = 'SIGN',
  Verify = 'VERIFY',
}

export type SignVerifyDialogProps = {
  open?: boolean;
  onClose?: (value: any) => void;
  onComplete?: () => void;
  mode: SignVerifyDialogMode;
};

export default function SignVerifyDialog(props: SignVerifyDialogProps) {
  const { onComplete, mode, open = false, onClose = () => ({}), ...rest } = props;
  const title = { [SignVerifyDialogMode.Sign]: t`Sign Message`, [SignVerifyDialogMode.Verify]: t`Verify Message` }[
    mode
  ];

  function handleClose() {
    onClose(false);
  }

  function handleCompletion() {
    onClose(true);
    if (onComplete) {
      onComplete();
    }
  }

  const content = {
    [SignVerifyDialogMode.Sign]: <SignMessage onComplete={handleCompletion} />,
    [SignVerifyDialogMode.Verify]: <VerifyMessage onComplete={handleCompletion} />,
  }[mode];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="sign-verify-dialog-title"
      aria-describedby="sign-verify-dialog-description"
      maxWidth="sm"
      fullWidth
      {...rest}
    >
      <DialogTitle id="sign-verify-dialog-title">
        <Flex flexDirection="row" gap={1}>
          <Typography variant="h6">{title}</Typography>
        </Flex>
      </DialogTitle>
      <DialogContent>
        <Flex flexDirection="column" gap={3}>
          {content}
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
