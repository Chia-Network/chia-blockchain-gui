import { useGetKeyringStatusQuery, useSetKeyringPassphraseMutation } from '@chia-network/api-react';
import {
  AlertDialog,
  Button,
  DialogActions,
  Flex,
  useValidateChangePassphraseParams,
  useOpenDialog,
  Suspender,
  Form,
  TextField,
  Checkbox,
} from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import {
  Help as HelpIcon,
  KeyboardCapslock as KeyboardCapslockIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

type SetPassphrasePromptFormData = {
  passphrase: string;
  passphraseConfirmation: string;
  passphraseHint: string;
  savePassphrase: boolean;
};

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function SetPassphrasePrompt(props: Props) {
  const { onSuccess, onCancel } = props;
  const openDialog = useOpenDialog();
  const { data: keyringState, isLoading } = useGetKeyringStatusQuery();
  const [setKeyringPassphrase, { isLoading: isLoadingSetKeyringPassphrase }] = useSetKeyringPassphraseMutation();
  const [validateChangePassphraseParams] = useValidateChangePassphraseParams();

  const formMethods = useForm<SetPassphrasePromptFormData>({
    defaultValues: {
      passphrase: '',
      passphraseConfirmation: '',
      passphraseHint: '',
      savePassphrase: false,
    },
  });

  const [showPassphraseText1, setShowPassphraseText1] = useState(false);
  const [showPassphraseText2, setShowPassphraseText2] = useState(false);
  const [showCapsLock, setShowCapsLock] = useState(false);

  async function validateDialog(passphrase: string, confirmation: string): Promise<boolean> {
    let isValid = false;

    if (passphrase === '' && confirmation === '') {
      await openDialog(
        <AlertDialog>
          <Trans>Please enter a passphrase</Trans>
        </AlertDialog>
      );
    } else {
      isValid = await validateChangePassphraseParams(null, passphrase, confirmation);
    }

    return isValid;
  }

  async function handleSubmit({
    passphrase,
    passphraseConfirmation,
    passphraseHint,
    savePassphrase,
  }: SetPassphrasePromptFormData) {
    const isValid = await validateDialog(passphrase, passphraseConfirmation);
    if (isValid) {
      try {
        await setKeyringPassphrase({
          // currentPassphrase: null,
          newPassphrase: passphrase,
          passphraseHint,
          savePassphrase,
        }).unwrap();

        onSuccess();
      } catch (error: any) {
        await openDialog(
          <AlertDialog>
            <Trans>Failed to set passphrase: {error.message}</Trans>
          </AlertDialog>
        );
        formMethods.setFocus('passphrase', { shouldSelect: true });
      }
    } else {
      formMethods.setFocus('passphrase', { shouldSelect: true });
    }
  }

  async function handleCancel() {
    onCancel();
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    const keyHandlerMapping: { [key: string]: () => Promise<void> } = {
      Enter: formMethods.handleSubmit(handleSubmit),
      Escape: handleCancel,
    };

    if (e.getModifierState('CapsLock')) {
      setShowCapsLock(true);
    }

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

  if (isLoading) {
    return <Suspender />;
  }

  const { canSavePassphrase, canSetPassphraseHint } = keyringState;

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
        <Trans>Set Passphrase</Trans>
      </DialogTitle>
      <Form methods={formMethods} onSubmit={formMethods.handleSubmit(handleSubmit)}>
        <DialogContent>
          <DialogContentText>
            <Trans>Enter a strong passphrase to secure your keys:</Trans>
          </DialogContentText>
          <Flex flexDirection="row" gap={1.5} alignItems="center">
            <TextField
              autoFocus
              disabled={isLoadingSetKeyringPassphrase}
              color="secondary"
              margin="dense"
              name="passphrase"
              label={<Trans>Passphrase</Trans>}
              placeholder="Passphrase"
              type={showPassphraseText1 ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <Flex alignItems="center">
                    <InputAdornment position="end">
                      {showCapsLock && (
                        <Flex>
                          <KeyboardCapslockIcon />
                        </Flex>
                      )}
                      <IconButton onClick={() => setShowPassphraseText1((s) => !s)}>
                        <VisibilityIcon />
                      </IconButton>
                    </InputAdornment>
                  </Flex>
                ),
              }}
              data-testid="SetPassphrasePrompt-passphrase"
              fullWidth
            />
          </Flex>
          <Flex flexDirection="row" gap={1.5} alignItems="center">
            <TextField
              disabled={isLoadingSetKeyringPassphrase}
              color="secondary"
              margin="dense"
              name="passphraseConfirmation"
              label={<Trans>Confirm Passphrase</Trans>}
              placeholder="Confirm Passphrase"
              type={showPassphraseText2 ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <Flex alignItems="center">
                    <InputAdornment position="end">
                      {showCapsLock && (
                        <Flex>
                          <KeyboardCapslockIcon />
                        </Flex>
                      )}
                      <IconButton onClick={() => setShowPassphraseText2((s) => !s)}>
                        <VisibilityIcon />
                      </IconButton>
                    </InputAdornment>
                  </Flex>
                ),
              }}
              data-testid="SetPassphrasePrompt-confirm-passphrase"
              fullWidth
            />
          </Flex>
          {!!canSetPassphraseHint && (
            <TextField
              disabled={isLoadingSetKeyringPassphrase}
              color="secondary"
              margin="dense"
              name="passphraseHint"
              label={<Trans>Passphrase Hint (Optional)</Trans>}
              placeholder={t`Passphrase Hint`}
              data-testid="SetPassphrasePrompt-hint"
              fullWidth
            />
          )}
          {!!canSavePassphrase && (
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={<Checkbox disabled={isLoadingSetKeyringPassphrase} name="savePassphrase" />}
                label={t`Save passphrase`}
                style={{ marginRight: '8px' }}
                data-testid="SetPassphrasePrompt-save-passphrase"
              />
              <Tooltip
                title={t`Your passphrase can be stored in your system's secure credential store. Chia will be able to access your keys without prompting for your passphrase.`}
              >
                <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
              </Tooltip>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isLoadingSetKeyringPassphrase}
            onClick={handleCancel}
            variant="outlined"
            data-testid="SetPassphrasePrompt-cancel"
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button
            disabled={isLoadingSetKeyringPassphrase}
            type="submit"
            color="primary"
            variant="contained"
            data-testid="SetPassphrasePrompt-set-passphrase"
          >
            <Trans>Set Passphrase</Trans>
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
