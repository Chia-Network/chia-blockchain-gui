import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Trans } from '@lingui/macro';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import {
  Help as HelpIcon,
} from '@material-ui/icons';
import { AlertDialog, TooltipIcon } from '@chia/core';
import { openDialog } from '../../modules/dialog';
import { RootState } from 'modules/rootReducer';

export default function AppKeyringMigrator() {
  const dispatch = useDispatch();
  let passphraseInput: any = null;
  let confirmationInput: any = null;
  let cleanupKeyringCheckbox: any = null;
  let minPassphraseLen = useSelector((state: RootState) => state.keyring_state.min_passphrase_length);

  function handleMigrate() {
    let passphrase = passphraseInput.value;
    let confirmation = confirmationInput.value;

    if (passphrase != confirmation) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>
              The provided passphrase and confirmation do not match
            </Trans>
          </AlertDialog>
        ),
      );
    }
    else if (passphrase.length < minPassphraseLen) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>
              Passphrases must be at least {minPassphraseLen} characters in length
            </Trans>
          </AlertDialog>
        ),
      );
    }
  }

  function stashInputRef(input: any) {
    passphraseInput = input;
  }

  function stashConfirmationInputRef(input: any) {
    confirmationInput = input;
  }

  return (
    <div>
      <Dialog 
        open={true}
        aria-labelledby="keyring-migration-dialog-title"
        fullWidth={true}
        maxWidth={'sm'}
        >
        <DialogTitle id="keyring-migration-dialog-title">Migration required</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            <Trans>
              Your keys need to be migrated to a new keyring that is optionally secured by a master passphrase.
            </Trans>
          </Typography>
          <Typography variant="body1" style={{ marginTop: '12px' }}>
            <Trans>
              Enter a strong passphrase and click Migrate to secure your keys
            </Trans>
          </Typography>
          <TextField
            autoFocus
            color="secondary"
            margin="dense"
            id="passphrase_input"
            label={<Trans>Passphrase</Trans>}
            placeholder="Passphrase"
            inputRef={stashInputRef}
            type="password"
            fullWidth
            />
          <TextField
            color="secondary"
            margin="dense"
            id="confirmation_input"
            label={<Trans>Confirm Passphrase</Trans>}
            placeholder="Confirm Passphrase"
            inputRef={stashConfirmationInputRef}
            type="password"
            fullWidth
            />
          <Box display="flex" alignItems="center" >
            <FormControlLabel
              control={(
                <Checkbox 
                  name="cleanupKeyringPostMigration"
                  inputRef={(input) => cleanupKeyringCheckbox = input}
                />
              )}
              label="Cleanup old keyring upon successful migration"
              style={{ marginRight: '8px' }}
            />
            <Tooltip title="After your keys are successfully migrated to the new keyring, you may choose to have your keys removed from the old keyring.">
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>                
          </Box>
          <DialogActions>
            <Button
                onClick={handleMigrate}
                color="primary"
                variant="contained"
                style={{ marginTop: '8px' }}
              >
                Migrate Keys
              </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
}