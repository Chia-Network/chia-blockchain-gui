import { PassphrasePromptReason } from '@chia-network/api';
import { useUnlockKeyringMutation, useGetKeyringStatusQuery } from '@chia-network/api-react';
import { Button, Flex, TooltipIcon, useShowError, Suspender, ButtonLoading, Form, TextField } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { KeyboardCapslock as KeyboardCapslockIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import React, { useState, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';

type FormData = {
  passphrase: string;
};

type Props = {
  reason: PassphrasePromptReason;
};

export default function AppPassPrompt(props: Props) {
  const { reason } = props;
  const showError = useShowError();
  const { data: keyringState, isLoading } = useGetKeyringStatusQuery();
  const [unlockKeyring, { isLoading: isLoadingUnlockKeyring }] = useUnlockKeyringMutation();
  const [showPassphraseText, setShowPassphraseText] = useState(false);
  const [showCapsLock, setShowCapsLock] = useState(false);

  const formMethods = useForm<FormData>({
    defaultValues: {
      passphrase: '',
    },
  });

  if (isLoading) {
    return <Suspender />;
  }

  const { userPassphraseIsSet, passphraseHint } = keyringState;

  async function handleSubmit({ passphrase }: FormData): Promise<void> {
    try {
      if (!passphrase) {
        throw new Error(t`Please enter a passphrase`);
      }

      await unlockKeyring({
        key: passphrase,
      }).unwrap();
    } catch (error: any) {
      showError(error);
      formMethods.setFocus('passphrase', { shouldSelect: true });
    }
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      formMethods.handleSubmit(handleSubmit);
    }

    if (e.getModifierState('CapsLock')) {
      setShowCapsLock(true);
    }
  }

  const handleKeyUp = (event) => {
    if (event.key === 'CapsLock') {
      setShowCapsLock(false);
    }
  };

  let dialogTitle: React.ReactElement;
  let submitButtonTitle: React.ReactElement;
  let cancellable = true;

  switch (reason) {
    case PassphrasePromptReason.KEYRING_LOCKED:
      dialogTitle = (
        <div>
          <Typography variant="h6">
            <Trans>Your keyring is locked</Trans>
          </Typography>
          <Typography variant="subtitle1">
            <Trans>Please enter your passphrase</Trans>
          </Typography>
        </div>
      );
      submitButtonTitle = <Trans>Unlock Keyring</Trans>;
      cancellable = false;
      break;
    case PassphrasePromptReason.DELETING_KEY:
      dialogTitle = (
        <div>
          <Typography variant="h6">
            <Trans>Deleting key</Trans>
          </Typography>
          <Typography variant="subtitle1">
            <Trans>Please enter your passphrase to proceed</Trans>
          </Typography>
        </div>
      );
      submitButtonTitle = <Trans>Delete Key</Trans>;
      break;
    default:
      dialogTitle = <Trans>Please enter your passphrase</Trans>;
      submitButtonTitle = <Trans>Submit</Trans>;
      break;
  }

  if (userPassphraseIsSet) {
    return (
      <div>
        <Dialog
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          open
          aria-labelledby="form-dialog-title"
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle id="form-dialog-title">{dialogTitle}</DialogTitle>
          <Form methods={formMethods} onSubmit={formMethods.handleSubmit(handleSubmit)}>
            <DialogContent>
              <Flex flexDirection="column" gap={1}>
                <Flex flexDirection="row" gap={1.5} alignItems="center">
                  <TextField
                    autoFocus
                    color="secondary"
                    disabled={isLoadingUnlockKeyring}
                    margin="dense"
                    name="passphrase"
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
                {passphraseHint && passphraseHint.length > 0 && (
                  <Flex gap={1} alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      <Trans>Hint</Trans>
                    </Typography>
                    <TooltipIcon>
                      <Typography variant="inherit">{passphraseHint}</Typography>
                    </TooltipIcon>
                  </Flex>
                )}
              </Flex>
            </DialogContent>
            <DialogActions>
              <ButtonLoading
                type="submit"
                color="primary"
                disabled={isLoadingUnlockKeyring}
                loading={isLoadingUnlockKeyring}
                variant="contained"
                style={{ marginBottom: '8px', marginRight: '8px' }}
              >
                {submitButtonTitle}
              </ButtonLoading>
              {cancellable && (
                <Button>
                  <Trans>Cancel</Trans>
                </Button>
              )}
            </DialogActions>
          </Form>
        </Dialog>
      </div>
    );
  }

  return null;
}
