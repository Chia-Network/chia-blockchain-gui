import React, { ReactElement } from 'react';
import { t, Trans } from '@lingui/macro';
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
import { useGetKeyringStatusQuery, useMigrateKeyringMutation } from '@chia/api-react';
import { AlertDialog, ConfirmDialog, useOpenDialog, useValidateChangePassphraseParams, Suspender, useSkipMigration } from '@chia/core';

export default function AppKeyringMigrator() {
  const [validateChangePassphraseParams] = useValidateChangePassphraseParams();
  const openDialog = useOpenDialog();
  const { data: keyringState, isLoading } = useGetKeyringStatusQuery();
  const [migrateKeyring, { isLoading: isLoadingMigrateKeyring}] = useMigrateKeyringMutation();
  const [_skipMigration, setSkipMigration] = useSkipMigration();

  if (isLoading) {
    return (
      <Suspender />
    );
  }

  const { 
    allowEmptyPassphrase,
    canSetPassphraseHint,
    canSavePassphrase,
    canRemoveLegacyKeys,
  } = keyringState;

  let passphraseInput: HTMLInputElement | null = null;
  let confirmationInput: HTMLInputElement | null = null;
  let passphraseHintInput: HTMLInputElement | null;
  let savePassphraseCheckbox: HTMLInputElement | null = null;
  let cleanupKeyringCheckbox: HTMLInputElement | null = null;

  async function validateDialog(passphrase: string, confirmation: string): Promise<boolean> {
    return await validateChangePassphraseParams(null, passphrase, confirmation);
  }

  async function handleSkipMigration(): Promise<void> {
    const skipMigration = await openDialog(
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
    );

      // @ts-ignore
    if (skipMigration) {
      setSkipMigration(true);
    }
  }

  async function handleMigrate(): Promise<void> {
    const passphrase: string = passphraseInput?.value ?? "";
    const confirmation: string = confirmationInput?.value ?? "";
    const passphraseHint: string = passphraseHintInput?.value ?? "";
    const savePassphrase: boolean = savePassphraseCheckbox?.checked ?? false;
    const cleanup: boolean = cleanupKeyringCheckbox?.checked ?? false;
    const isValid: boolean = await validateDialog(passphrase, confirmation);

    if (isValid) {
      try {
        await migrateKeyring({
          passphrase,
          passphraseHint,
          savePassphrase,
          cleanupLegacyKeyring: cleanup,
        }).unwrap();
      } catch (error: any) {
        await openDialog(
          <AlertDialog>
            <Trans>
              Keyring migration failed: {error.message}
            </Trans>
          </AlertDialog>
        );
      }
    }
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
    <Dialog
      aria-labelledby="keyring-migration-dialog-title"
      fullWidth={true}
      maxWidth={'sm'}
      open
      >
      <DialogTitle id="keyring-migration-dialog-title"><Trans>Migration required</Trans></DialogTitle>
      <DialogContent>
        <Typography variant="body1">{dialogMessage}</Typography>
        <Typography variant="body1" style={{ marginTop: '12px' }}>
          <Trans>
            Enter a strong passphrase and click Migrate Keys to secure your keys
          </Trans>
        </Typography>
        <TextField
          autoFocus
          color="secondary"
          disabled={isLoadingMigrateKeyring}
          margin="dense"
          id="passphrase_input"
          label={<Trans>Passphrase</Trans>}
          placeholder={t`Passphrase`}
          inputRef={(input: HTMLInputElement) => passphraseInput = input}
          type="password"
          fullWidth
          />
        <TextField
          color="secondary"
          disabled={isLoadingMigrateKeyring}
          margin="dense"
          id="confirmation_input"
          label={<Trans>Confirm Passphrase</Trans>}
          placeholder={t`Confirm Passphrase`}
          inputRef={(input: HTMLInputElement) => confirmationInput = input}
          type="password"
          fullWidth
          />
        {canSetPassphraseHint && (
          <TextField
            disabled={isLoadingMigrateKeyring}
            color="secondary"
            margin="dense"
            id="passphraseHintInput"
            label={<Trans>Passphrase Hint (Optional)</Trans>}
            placeholder={t`Passphrase Hint`}
            inputRef={(input) => passphraseHintInput = input}
            fullWidth
          />
        )}
        {canSavePassphrase && (
          <Box display="flex" alignItems="center">
            <FormControlLabel
              control={(
                <Checkbox
                  disabled={isLoadingMigrateKeyring}
                  name="cleanupKeyringPostMigration"
                  inputRef={(input) => savePassphraseCheckbox = input}
                />
              )}
              label={t`Save passphrase`}
              style={{ marginRight: '8px' }}
            />
            <Tooltip title={t`Your passphrase can be stored in your system's secure credential store. Chia will be able to access your keys without prompting for your passphrase.`}>
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>
          </Box>
        )}
        {canRemoveLegacyKeys && (
          <Box display="flex" alignItems="center">
            <FormControlLabel
              control={(
                <Checkbox
                  disabled={isLoadingMigrateKeyring}
                  name="cleanupKeyringPostMigration"
                  inputRef={(input) => cleanupKeyringCheckbox = input}
                />
              )}
              label={t`Remove keys from old keyring upon successful migration`}
              style={{ marginRight: '8px' }}
            />
            <Tooltip title={t`After your keys are successfully migrated to the new keyring, you may choose to have your keys removed from the old keyring.`}>
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>
          </Box>
        )}
        <DialogActions>
          <Box display="flex" alignItems="center" style={{ marginTop: '8px' }}>
            <Fade in={isLoadingMigrateKeyring}>
              <CircularProgress
                size={32}
                style={{ marginRight: '4px' }}
              />
            </Fade>
            <Button
              disabled={isLoadingMigrateKeyring}
              onClick={handleSkipMigration}
              color="secondary"
              variant="contained"
              style={{ marginLeft: '8px' }}
            >
              <Trans>
                Skip
              </Trans>
            </Button>
            <Button
              disabled={isLoadingMigrateKeyring}
              onClick={handleMigrate}
              color="primary"
              variant="contained"
              style={{ marginLeft: '8px' }}
            >
              <Trans>
                Migrate Keys
              </Trans>
            </Button>
          </Box>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
