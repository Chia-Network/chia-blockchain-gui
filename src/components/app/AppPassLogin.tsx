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
import { unlockKeyring } from '../../modules/daemon_messages';

export default function AppPassLogin() {
  const dispatch = useDispatch();
  let passphrase_status = useSelector((state) => state.daemon_state.passphrase_status);
  let passphrase_lock_status = useSelector((state) => state.daemon_state.passphrase_lock_status);
  console.log("APP PASS LOGIN")
  console.log(passphrase_status)
  console.log(passphrase_lock_status)
  if (passphrase_status) {
    const open = true

    let passphrase_input = null;

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

    return (
      <div>
        <Dialog
          open={open}
          aria-labelledby="form-dialog-title"
          fullWidth={true}
          maxWidth = {'xs'}
        >
          <DialogTitle id="form-dialog-title">Enter your passphrase:</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              color="secondary"
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
              variant="contained"
              style={{ marginBottom: '8px', marginRight: '8px' }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }

  return null;

}
