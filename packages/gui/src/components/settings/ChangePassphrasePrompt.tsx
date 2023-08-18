import {
  useGetKeyringStatusQuery,
  useRemoveKeyringPassphraseMutation,
  useSetKeyringPassphraseMutation,
} from '@chia-network/api-react';
import {
  AlertDialog,
  Button,
  Color,
  DialogActions,
  Flex,
  useOpenDialog,
  Suspender,
  useValidateChangePassphraseParams,
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

type ChangePassphrasePromptFormData = {
  currentPassphrase: string;
  newPassphrase: string;
  passphraseConfirmation: string;
  passphraseHint: string;
  savePassphrase: boolean;
};

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ChangePassphrasePrompt(props: Props) {
  const { onSuccess, onCancel } = props;
  const openDialog = useOpenDialog();
  const [validateChangePassphraseParams] = useValidateChangePassphraseParams();
  const [removeKeyringPassphrase, { isLoading: isLoadingRemoveKeyringPassphrase }] =
    useRemoveKeyringPassphraseMutation();
  const [setKeyringPassphrase, { isLoading: isLoadingSetKeyringPassphrase }] = useSetKeyringPassphraseMutation();
  const [showPassphraseText1, setShowPassphraseText1] = useState(false);
  const [showPassphraseText2, setShowPassphraseText2] = useState(false);
  const [showPassphraseText3, setShowPassphraseText3] = useState(false);
  const [showCapsLock, setShowCapsLock] = useState(false);

  const isProcessing = isLoadingRemoveKeyringPassphrase || isLoadingSetKeyringPassphrase;

  const formMethods = useForm<ChangePassphrasePromptFormData>({
    defaultValues: {
      currentPassphrase: '',
      newPassphrase: '',
      passphraseConfirmation: '',
      passphraseHint: '',
      savePassphrase: false,
    },
  });

  const { data: keyringState, isLoading } = useGetKeyringStatusQuery();

  if (isLoading) {
    return <Suspender />;
  }

  const { canSavePassphrase, canSetPassphraseHint } = keyringState;

  async function validateDialog(currentPassphrase: string, newPassphrase: string, confirmation: string) {
    let isValid = false;

    if (currentPassphrase === '' && newPassphrase === '' && confirmation === '') {
      await openDialog(
        <AlertDialog>
          <Trans>Please enter your current passphrase, and a new passphrase</Trans>
        </AlertDialog>
      );
    } else {
      isValid = await validateChangePassphraseParams(currentPassphrase, newPassphrase, confirmation);
    }

    return isValid;
  }

  async function handleSubmit({
    currentPassphrase,
    newPassphrase,
    passphraseConfirmation,
    passphraseHint,
    savePassphrase,
  }: ChangePassphrasePromptFormData) {
    const isValid = await validateDialog(currentPassphrase, newPassphrase, passphraseConfirmation);

    if (isValid) {
      try {
        if (newPassphrase === '') {
          await removeKeyringPassphrase({
            currentPassphrase,
          }).unwrap();
        } else {
          await setKeyringPassphrase({
            currentPassphrase,
            newPassphrase,
            passphraseHint,
            savePassphrase,
          }).unwrap();
        }
        onSuccess();
      } catch (error: any) {
        await openDialog(
          <AlertDialog>
            <Trans>Failed to update passphrase: {error.message}</Trans>
          </AlertDialog>
        );
      }
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

  return (
    <Dialog
      open
      aria-labelledby="form-dialog-title"
      fullWidth
      maxWidth="sm"
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
    >
      <DialogTitle id="form-dialog-title">Change Passphrase</DialogTitle>
      <Form methods={formMethods} onSubmit={formMethods.handleSubmit(handleSubmit)}>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Enter your current passphrase and a new passphrase:</DialogContentText>
          <Flex flexDirection="row" gap={1.5} alignItems="center">
            <TextField
              autoFocus
              disabled={isProcessing}
              color="secondary"
              name="currentPassphrase"
              label={<Trans>Current Passphrase</Trans>}
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
              fullWidth
            />
          </Flex>
          <Flex flexDirection="row" gap={1.5} alignItems="center">
            <TextField
              disabled={isProcessing}
              color="secondary"
              margin="dense"
              name="newPassphrase"
              label={<Trans>New Passphrase</Trans>}
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
              fullWidth
            />
          </Flex>
          <Flex flexDirection="row" gap={1.5} alignItems="center">
            <TextField
              disabled={isProcessing}
              color="secondary"
              margin="dense"
              name="passphraseConfirmation"
              label={<Trans>Confirm New Passphrase</Trans>}
              type={showPassphraseText3 ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <Flex alignItems="center">
                    <InputAdornment position="end">
                      {showCapsLock && (
                        <Flex>
                          <KeyboardCapslockIcon />
                        </Flex>
                      )}
                      <IconButton onClick={() => setShowPassphraseText3((s) => !s)}>
                        <VisibilityIcon />
                      </IconButton>
                    </InputAdornment>
                  </Flex>
                ),
              }}
              fullWidth
            />
          </Flex>
          {!!canSetPassphraseHint && (
            <TextField
              disabled={isProcessing}
              color="secondary"
              margin="dense"
              name="passphraseHint"
              label={<Trans>Passphrase Hint (Optional)</Trans>}
              placeholder={t`Passphrase Hint`}
              fullWidth
            />
          )}
          {!!canSavePassphrase && (
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={<Checkbox disabled={isProcessing} name="savePassphrase" />}
                label={t`Save passphrase`}
                style={{ marginRight: '8px' }}
              />
              <Tooltip
                title={t`Your passphrase can be stored in your system's secure credential store. Chia will be able to access your keys without prompting for your passphrase.`}
              >
                <HelpIcon style={{ color: Color.Neutral[300], fontSize: 12 }} />
              </Tooltip>
            </Box>
          )}
          <DialogActions>
            <Button disabled={isProcessing} onClick={handleCancel} color="secondary" variant="outlined">
              <Trans>Cancel</Trans>
            </Button>
            <Button disabled={isProcessing} type="submit" color="primary" variant="contained">
              <Trans>Change Passphrase</Trans>
            </Button>
          </DialogActions>
        </DialogContent>
      </Form>
    </Dialog>
  );
}
