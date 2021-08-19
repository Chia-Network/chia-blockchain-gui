import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { change_keyring_passphrase_action } from '../../modules/message';
import { validateChangePassphraseParams } from '../app/AppPassPrompt';
import { RootState } from '../../modules/rootReducer';

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function SetPassphrasePrompt(props: Props) {
  const dispatch = useDispatch();
  const { onSuccess, onCancel } = props;
  const keyring_state = useSelector((state: RootState) => state.keyring_state);
  const [actionInProgress, setActionInProgress] = React.useState(false);
  let passphraseInput: HTMLInputElement | null;
  let confirmationInput: HTMLInputElement | null;

  const [needsFocusAndSelect, setNeedsFocusAndSelect] = React.useState(false);
  useEffect(() => {
    if (needsFocusAndSelect && passphraseInput) {
      passphraseInput.focus();
      passphraseInput.select();
      setNeedsFocusAndSelect(false);
    }
  });

  async function validateDialog(passphrase: string, confirmation: string): Promise<boolean> {
    let isValid: boolean = false;

    if (passphrase === "" && confirmation === "") {
      await dispatch(
        openDialog(
          <AlertDialog>
            <Trans>
              Please enter a passphrase
            </Trans>
          </AlertDialog>
        )
      );
    } else {
      isValid = await validateChangePassphraseParams(dispatch, keyring_state, null, passphrase, confirmation);
    }

    return isValid;
  }

  async function handleSubmit() {
    const passphrase: string = passphraseInput?.value ?? "";
    const confirmation: string = confirmationInput?.value ?? "";
    const isValid = await validateDialog(passphrase, confirmation);

    if (isValid) {
      setActionInProgress(true);

      try {
        await dispatch(
          change_keyring_passphrase_action(
            null,
            passphrase,
            () => { onSuccess() }, // success
            async (error: string) => { // failure
              await dispatch(
                openDialog(
                  <AlertDialog>
                    <Trans>
                      Failed to set passphrase: {error}
                    </Trans>
                  </AlertDialog>
                )
              );
              setActionInProgress(false);
              setNeedsFocusAndSelect(true);
            }
          )
        );
      }
      catch (e) {
        setActionInProgress(false);
      }
    } else {
      setNeedsFocusAndSelect(true);
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
        <Trans>Set Passphrase</Trans>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans>
            Enter a strong passphrase to secure your keys:
          </Trans>
        </DialogContentText>
        <TextField
          autoFocus
          disabled={actionInProgress}
          color="secondary"
          margin="dense"
          id="passphraseInput"
          label={<Trans>Passphrase</Trans>}
          placeholder="Passphrase"
          inputRef={(input) => passphraseInput = input}
          type="password"
          fullWidth
        />
        <TextField
          disabled={actionInProgress}
          color="secondary"
          margin="dense"
          id="confirmationInput"
          label={<Trans>Confirm Passphrase</Trans>}
          placeholder="Confirm Passphrase"
          inputRef={(input) => confirmationInput = input}
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
          <Trans>Set Passphrase</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}