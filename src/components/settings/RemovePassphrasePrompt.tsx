import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@material-ui/core';
import { Trans } from '@lingui/macro';
import { AlertDialog } from '@chia/core';
import { openDialog } from '../../modules/dialog';
import { remove_keyring_passphrase_action } from '../../modules/message';

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function RemovePassphrasePrompt(props: Props) {
  const dispatch = useDispatch();
  const { onSuccess, onCancel } = props;
  const [actionInProgress, setActionInProgress] = React.useState(false);
  let passphraseInput: HTMLInputElement | null;

  const [needsFocusAndSelect, setNeedsFocusAndSelect] = React.useState(false);
  useEffect(() => {
    if (needsFocusAndSelect && passphraseInput) {
      passphraseInput.focus();
      passphraseInput.select();
      setNeedsFocusAndSelect(false);
    }
  });

  async function handleSubmit() {
    const passphrase: string | undefined = passphraseInput?.value;

    setActionInProgress(true);

    try {
      if (!passphrase || passphrase.length == 0) {
        await dispatch(
          openDialog(
            <AlertDialog>
              <Trans>
                Please enter your passphrase
              </Trans>
            </AlertDialog>
          ),
        );
        setActionInProgress(false);
        setNeedsFocusAndSelect(true);
      } else {
        await dispatch(
          remove_keyring_passphrase_action(
            passphrase,
            () => { onSuccess() }, // success
            async (error: string) => { // failure
              await dispatch(
                openDialog(
                  <AlertDialog>
                    <Trans>
                      Passphrase is incorrect
                    </Trans>
                  </AlertDialog>
                ),
              );
              setActionInProgress(false);
              setNeedsFocusAndSelect(true);
            }
          )
        );
      }
    }
    catch (e) {
      setActionInProgress(false);
    }
  }
  
  async function handleCancel() {
    onCancel();
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    const keyHandlerMapping: { [key: string]: () => Promise<void> } = {
      'Enter' : handleSubmit,
      'Escape' : handleCancel,
    };
    const handler: () => Promise<void> | undefined = keyHandlerMapping[e.key];
  
    if (handler) {
      // Disable default event handling to avoid navigation updates
      e.preventDefault();
      e.stopPropagation();
  
      await handler();
    }
  }

  return (
    <Dialog
      open={true}
      aria-labelledby="form-dialog-title"
      fullWidth={true}
      maxWidth = {'xs'}
      onKeyDown={handleKeyDown}
    >
      <DialogTitle id="form-dialog-title">
        <Trans>Remove Passphrase</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans>Enter your passphrase:</Trans>
        </DialogContentText>
        <TextField
          autoFocus
          disabled={actionInProgress}
          color="secondary"
          margin="dense"
          id="passphraseInput"
          label={<Trans>Passphrase</Trans>}
          inputRef={(input) => passphraseInput = input}
          type="password"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button
          disabled={actionInProgress}
          onClick={handleCancel}
          color="secondary"
          variant="contained"
          style={{ marginBottom: '8px', marginRight: '8px' }}
        >
          <Trans>Cancel</Trans>
        </Button>
        <Button
          disabled={actionInProgress}
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          style={{ marginBottom: '8px', marginRight: '8px' }}
        >
          <Trans>Remove Passphrase</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}