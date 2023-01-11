import { useRemoveKeyringPassphraseMutation, useGetKeyringStatusQuery } from '@chia-network/api-react';
import {
  AlertDialog,
  Button,
  DialogActions,
  Flex,
  TooltipIcon,
  useOpenDialog,
  Suspender,
  TextField,
  Form,
} from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { KeyboardCapslock as KeyboardCapslockIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

type RemovePassphrasePromptFormData = {
  passphrase: string;
};

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function RemovePassphrasePrompt(props: Props) {
  const { onSuccess, onCancel } = props;
  const openDialog = useOpenDialog();
  const { data: keyringState, isLoading } = useGetKeyringStatusQuery();
  const [removeKeyringPassphrase, { isLoading: isLoadingRemoveKeyringPassphrase }] =
    useRemoveKeyringPassphraseMutation();
  const formMethods = useForm<RemovePassphrasePromptFormData>({
    defaultValues: {
      passphrase: '',
    },
  });

  const [showPassphraseText, setShowPassphraseText] = useState(false);
  const [showCapsLock, setShowCapsLock] = useState(false);

  if (isLoading) {
    return <Suspender />;
  }

  const { passphraseHint } = keyringState;

  async function handleSubmit(values: RemovePassphrasePromptFormData) {
    const { passphrase } = values;

    try {
      if (!passphrase) {
        throw new Error(t`Please enter your passphrase`);
      }

      await removeKeyringPassphrase({
        currentPassphrase: passphrase,
      }).unwrap();

      onSuccess();
    } catch (error: any) {
      await openDialog(<AlertDialog>{error.message}</AlertDialog>);
      formMethods.setFocus('passphrase', { shouldSelect: true });
    }
  }

  function handleCancel() {
    onCancel();
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.getModifierState('CapsLock')) {
      setShowCapsLock(true);
    }

    const keyHandlerMapping: { [key: string]: () => Promise<void> } = {
      Enter: formMethods.handleSubmit(handleSubmit),
      Escape: handleCancel,
    };
    const handler: () => Promise<void> | undefined = keyHandlerMapping[e.key];

    if (handler) {
      // Disable default event handling to avoid navigation updates
      e.preventDefault();
      e.stopPropagation();

      await handler();
    }
  }

  const handleKeyUp = (event) => {
    if (event.key === 'CapsLock') {
      setShowCapsLock(false);
    }
  };

  return (
    <Dialog
      open
      aria-labelledby="form-dialog-title"
      fullWidth
      maxWidth="xs"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <DialogTitle id="form-dialog-title">
        <Trans>Remove Passphrase</Trans>
      </DialogTitle>
      <Form methods={formMethods} onSubmit={formMethods.handleSubmit(handleSubmit)}>
        <DialogContent>
          <DialogContentText>
            <Trans>Enter your passphrase:</Trans>
          </DialogContentText>
          <Flex flexDirection="row" gap={1.5} alignItems="center">
            <TextField
              name="passphrase"
              disabled={isLoadingRemoveKeyringPassphrase}
              color="secondary"
              margin="dense"
              label={<Trans>Passphrase</Trans>}
              type={showPassphraseText ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <Flex alignItems="center">
                    <InputAdornment position="end">
                      {showCapsLock && (
                        <Flex>
                          <KeyboardCapslockIcon />
                        </Flex>
                      )}
                      <IconButton onClick={() => setShowPassphraseText((s) => !s)}>
                        <VisibilityIcon />
                      </IconButton>
                    </InputAdornment>
                  </Flex>
                ),
              }}
              fullWidth
            />
          </Flex>
          {!!passphraseHint && (
            <Flex gap={1} alignItems="center" style={{ marginTop: '8px' }}>
              <Typography variant="body2" color="textSecondary">
                <Trans>Hint</Trans>
              </Typography>
              <TooltipIcon>
                <Typography variant="inherit">{passphraseHint}</Typography>
              </TooltipIcon>
            </Flex>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isLoadingRemoveKeyringPassphrase}
            onClick={handleCancel}
            color="secondary"
            variant="outlined"
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button disabled={isLoadingRemoveKeyringPassphrase} type="submit" color="primary" variant="contained">
            <Trans>Remove Passphrase</Trans>
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
