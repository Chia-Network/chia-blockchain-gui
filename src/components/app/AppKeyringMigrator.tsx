import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trans } from '@lingui/macro';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  FormControlLabel,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import {
  Help as HelpIcon,
} from '@material-ui/icons';
import { AlertDialog, ConfirmDialog, Flex, Logo } from '@chia/core';
import { openDialog } from '../../modules/dialog';
import { RootState } from '../../modules/rootReducer';
import { migrate_keyring_action, skipKeyringMigration } from '../../modules/message';
import { validateChangePassphraseParams } from './AppPassPrompt';
import { ReactElement } from 'react';

export default function AppKeyringMigrator() {
  const dispatch = useDispatch();
  const keyring_state = useSelector((state: RootState) => state.keyring_state);
  const allowEmptyPassphrase = keyring_state.allow_empty_passphrase;
  const migrationInProgress = keyring_state.migration_in_progress;
  let passphraseInput: HTMLInputElement | null = null;
  let confirmationInput: HTMLInputElement | null = null;
  let cleanupKeyringCheckbox: HTMLInputElement | null = null;

  async function validateDialog(passphrase: string, confirmation: string): Promise<boolean> {
    return await validateChangePassphraseParams(dispatch, keyring_state, null, passphrase, confirmation);
  }

  async function handleSkipMigration() {
    const skipMigration = await dispatch(
      openDialog(
        <ConfirmDialog
          title={<Trans>Skip Keyring Migration</Trans>}
          confirmTitle={<Trans>Skip</Trans>}
          confirmColor="danger"
          // @ts-ignore
          maxWidth="xs"
        >
          <Trans>
            Your keys have not been migrated to a new keyring. You will be unable to create new keys or delete existing keys until migration completes. Are you sure you want to skip migrating your keys?
          </Trans>
        </ConfirmDialog>
      )
    );

      // @ts-ignore
    if (skipMigration) {
      dispatch(skipKeyringMigration(true));
    }
  }

  async function handleMigrate() {
    const passphrase: string = passphraseInput?.value ?? "";
    const confirmation: string = confirmationInput?.value ?? "";
    const cleanup = cleanupKeyringCheckbox?.checked ?? false;
    const isValid = await validateDialog(passphrase, confirmation);

    if (isValid) {
      dispatch(
        migrate_keyring_action(
          passphrase,
          cleanup,
          (error: string) => {
            dispatch(
              openDialog(
                <AlertDialog>
                  <Trans>
                    Keyring migration failed: {error}
                  </Trans>
                </AlertDialog>
              )
            )
          }
        )
      );
    }
  }

  function stashInputRef(input: any) {
    passphraseInput = input;
  }

  function stashConfirmationInputRef(input: any) {
    confirmationInput = input;
  }

  let dialogMessage: ReactElement | null = null;
  if (allowEmptyPassphrase) {
    dialogMessage = (
      <Trans>
        Your keys need to be migrated to a new keyring that is optionally secured by a master passphrase.
      </Trans>
    );
  } else {
    dialogMessage = (
      <Trans>
        Your keys need to be migrated to a new keyring that is secured by a master passphrase.
      </Trans>
    );
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
          <Typography variant="body1">{dialogMessage}</Typography>
          <Typography variant="body1" style={{ marginTop: '12px' }}>
            <Trans>
              Enter a strong passphrase and click Migrate to secure your keys
            </Trans>
          </Typography>
          <TextField
            autoFocus
            color="secondary"
            disabled={migrationInProgress}
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
            disabled={migrationInProgress}
            margin="dense"
            id="confirmation_input"
            label={<Trans>Confirm Passphrase</Trans>}
            placeholder="Confirm Passphrase"
            inputRef={stashConfirmationInputRef}
            type="password"
            fullWidth
            />
          <Box display="flex" alignItems="center">
            <FormControlLabel
              control={(
                <Checkbox 
                  disabled={migrationInProgress}
                  name="cleanupKeyringPostMigration"
                  inputRef={(input) => cleanupKeyringCheckbox = input}
                />
              )}
              label="Remove keys from old keyring upon successful migration"
              style={{ marginRight: '8px' }}
            />
            <Tooltip title="After your keys are successfully migrated to the new keyring, you may choose to have your keys removed from the old keyring.">
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>                
          </Box>
          <DialogActions>
            <Box display="flex" alignItems="center" style={{ marginTop: '8px' }}>
              <Fade in={migrationInProgress}>
                <CircularProgress
                  size={32}
                  style={{ marginRight: '4px' }}
                />
              </Fade>
              <Button
                disabled={migrationInProgress}
                onClick={handleSkipMigration}
                color="secondary"
                variant="contained"
                style={{ marginLeft: '8px' }}
              >
                Skip
              </Button>
              <Button
                disabled={migrationInProgress}
                onClick={handleMigrate}
                color="primary"
                variant="contained"
                style={{ marginLeft: '8px' }}
              >
                Migrate Keys
              </Button>
            </Box>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
}