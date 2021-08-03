import React from 'react';
// import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '../../modules/rootReducer';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
} from '@material-ui/core';
import { Trans } from '@lingui/macro';
import { AlertDialog } from '@chia/core';
import { openDialog } from '../../modules/dialog';
import { unlockKeyring } from '../../modules/daemon_messages';
import { RootState } from 'modules/rootReducer';

export default function AppPassLogin() {
  const dispatch = useDispatch();
  let user_passphrase_is_set = useSelector((state: RootState) => state.daemon_state.keyring_user_passphrase_set);
  let keyring_locked = useSelector((state: RootState) => state.daemon_state.keyring_locked);
  let unlock_in_progress = useSelector((state: RootState) => state.daemon_state.keyring_unlock_in_progress);
  let passphrase_input: any = null;


  console.log("APP PASS LOGIN");
  console.log("user_passphrase_is_set: " + user_passphrase_is_set);
  console.log("keyring_locked: " + keyring_locked);
  console.log("unlock_in_progress: " + unlock_in_progress);

  function handleSubmit() {
    if (
      passphrase_input.value === ''
    ) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>
              Please enter a passphrase
            </Trans>
          </AlertDialog>
        ),
      );
      return;
    }
    dispatch(unlockKeyring(passphrase_input.value));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  if (user_passphrase_is_set) {
    return (
      <div>
        <Dialog
          open={true}
          aria-labelledby="form-dialog-title"
          fullWidth={true}
          maxWidth = {'xs'}
        >
          <DialogTitle id="form-dialog-title">Enter your passphrase:</DialogTitle>
          <DialogContent>
            <TextField
              onKeyDown={handleKeyDown}
              autoFocus
              color="secondary"
              disabled={unlock_in_progress}
              margin="dense"
              id="passphrase_input"
              label={<Trans>Passphrase</Trans>}
              inputRef={(input) => {
                passphrase_input = input;
              }}
              type="password"
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleSubmit}
              color="primary"
              disabled={unlock_in_progress}
              variant="contained"
              style={{ marginBottom: '8px', marginRight: '8px' }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  return null;

}
