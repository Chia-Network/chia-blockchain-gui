import React from 'react';
import { Trans } from '@lingui/macro';
import LayoutMain from '../layout/LayoutMain';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertDialog,
  Flex,
  Card,
} from '@chia/core';
import {
  Grid,
  Typography,
  TextField,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@material-ui/core';
import {
  Help as HelpIcon,
  Lock as LockIcon,
  NoEncryption as NoEncryptionIcon,
} from '@material-ui/icons';
import { openDialog } from '../../modules/dialog';
import { setKeyringPassphrase, changeKeyringPassphrase, removeKeyringPassphrase } from '../../modules/daemon_messages';
import { RootState } from '../../modules/rootReducer';

const useStyles = makeStyles((theme) => ({
  passToggleBox: {
    alignItems: 'center',
  },
  passChangeBox: {
    paddingTop: 20,
  },
  oldPass: {
    paddingRight: 20,
  },
  togglePassButton: {
    marginLeft: theme.spacing(4),
  },
  updatePassButton: {
    marginLeft: theme.spacing(6),
    marginRight: theme.spacing(2),
    height: 56,
    width: 150,
  },
}));

const SecurityCard = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  let toggle_passphrase_input: HTMLInputElement | null;
  let oldpass_input: HTMLInputElement;
  let newpass_input: HTMLInputElement;
  let confirmpass_input: HTMLInputElement;
  let userPassphraseIsSet = useSelector(
    (state: RootState) => state.keyring_state.user_passphrase_set,
  );

  const [toggleOpen, setToggleOpen] = React.useState(false);

  const handleToggleOpen = () => {
    setToggleOpen(true);
  };

  const handleToggleClose = () => {
    setToggleOpen(false);
  };

  const [changeOpen, setChangeOpen] = React.useState(false);

  const handleChangeOpen = () => {
    setChangeOpen(true);
  }

  const handleChangeClose = () => {
    setChangeOpen(false);
  };

  function DisplayLockStatus() {
    if (userPassphraseIsSet) {
      return (
        <Typography variant="subtitle1" style={{ color: '#3AAC59', fontWeight: "bold" }}> ENABLED </Typography>
      )
    }
    else {
      return (
        <Typography variant="subtitle1" style={{ color: 'red', fontWeight: "bold" }}> NOT ENABLED </Typography>
      )
    }
  }

  function DisplayToggleStatus() {
    if (userPassphraseIsSet) {
      return (
        <Typography> REMOVE PASSPHRASE </Typography>
      )
    }
    else {
      return (
        <Typography> ADD PASSPHRASE </Typography>
      )
    }
  }

  function DisplayDialogTextStatus() {
    if (userPassphraseIsSet) {
      return (
        <DialogTitle id="form-dialog-title">Remove Passphrase</DialogTitle>
      )
    } else {
      return (
        <DialogTitle id="form-dialog-title">Add Passphrase</DialogTitle>
      )
    }
  }

  function DisplayDialogContentText() {
    if (userPassphraseIsSet) {
      return (
        <DialogContentText>Enter your passphrase:</DialogContentText>
      )
    } else {
      return (
        <DialogContentText>Enter a new passphrase:</DialogContentText>
      )
    }
  }

  function DisplayChangePassphrase() {
    if (userPassphraseIsSet) {
      return (
        <Box display="flex" className={classes.passChangeBox}>
          <Button
            onClick={handleChangeOpen}
            className={classes.togglePassButton}
            variant="contained"
            disableElevation
          >
            CHANGE PASSPHRASE
          </Button>
          <Dialog
            open={changeOpen}
            aria-labelledby="form-dialog-title"
            fullWidth={true}
            maxWidth = {'xs'}
          >
            <DialogTitle id="form-dialog-title">Change Passphrase</DialogTitle>
            <DialogContent>
              <DialogContentText>Enter your current passphrase and a new passphrase:</DialogContentText>
              <TextField
                autoFocus
                color="secondary"
                id="passphrase_input"
                inputRef={(input) => {
                  oldpass_input = input;
                }}
                label={<Trans>Old Passphrase</Trans>}
                type="password"
                fullWidth
              />
              <TextField
                color="secondary"
                margin="dense"
                id="passphrase_input"
                inputRef={(input) => {
                  newpass_input = input;
                }}
                label={<Trans>New Passphrase</Trans>}
                type="password"
                fullWidth
              />
              <TextField
                color="secondary"
                margin="dense"
                id="passphrase_input"
                inputRef={(input) => {
                  confirmpass_input = input;
                }}
                label={<Trans>Confirm New Passphrase</Trans>}
                type="password"
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleChangeClose}
                color="primary"
                variant="contained"
                style={{ marginBottom: '8px', marginRight: '8px' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangeSubmit}
                color="primary"
                variant="contained"
                style={{ marginBottom: '8px', marginRight: '8px' }}
              >
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )
    }
    else {
      return (null);
    }
  }

  function handleToggleSubmit() {
    if (!toggle_passphrase_input) {
      return;
    }
    
    let passphrase = toggle_passphrase_input.value;

    if (userPassphraseIsSet) {
      dispatch(removeKeyringPassphrase(passphrase))
    }
    else {
      dispatch(setKeyringPassphrase(passphrase))
    }
  }

  function handleChangeSubmit() {
    if (newpass_input.value !== confirmpass_input.value) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>The provided new passphrase and confirmation do not match</Trans>
          </AlertDialog>,
        ),
      );
      return;
    }
    if (newpass_input.value.length < 8) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Your new passphrase must be at least 8 characters</Trans>
          </AlertDialog>,
        ),
      );
      return;
    }
    dispatch(changeKeyringPassphrase(oldpass_input.value, newpass_input.value));
  }

  return (
    <Card title={<Trans>Passphrase Settings</Trans>}>
      <Grid spacing={4} container>
        <Grid item xs={12}>
          <Box display="flex" className={classes.passToggleBox}>
            {userPassphraseIsSet ? (
              <LockIcon style={{ color: '#3AAC59',  marginRight: 6 }} />
            ) : (
              <NoEncryptionIcon style={{ color: 'red',  marginRight: 6 }} />
            )}
            <Typography variant="subtitle1" style={{ marginRight: 5 }}>Passphrase protection is</Typography>
            {userPassphraseIsSet ? (
              <Typography variant="subtitle1" style={{ marginRight: 5 }}>enabled</Typography>
            ) : (
              <Typography variant="subtitle1" style={{ marginRight: 5 }}>disabled</Typography>
            )}
            <Tooltip title="Secure your keychain using a strong passphrase.">
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>
          </Box>
          <DisplayChangePassphrase />
          <Box display="flex" className={classes.passChangeBox}>
            {userPassphraseIsSet ? (
              <Button
                onClick={handleToggleOpen}
                className={classes.togglePassButton}
                variant="contained"
                disableElevation
              >
              REMOVE PASSPHRASE
              </Button>
            ) : (
              <Button
                onClick={handleToggleOpen}
                className={classes.togglePassButton}
                variant="contained"
                disableElevation
              >
              ADD PASSPHRASE
              </Button>
            )}
            <Dialog
              open={toggleOpen}
              aria-labelledby="form-dialog-title"
              fullWidth={true}
              maxWidth = {'xs'}
            >
              <DisplayDialogTextStatus />
              <DialogContent>
                <DisplayDialogContentText />
                <TextField
                  autoFocus
                  color="secondary"
                  margin="dense"
                  id="passphrase_input"
                  label={<Trans>Passphrase</Trans>}
                  inputRef={(input) => {
                    toggle_passphrase_input = input;
                  }}
                  type="password"
                  fullWidth
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleToggleClose}
                  color="primary"
                  variant="contained"
                  style={{ marginBottom: '8px', marginRight: '8px' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleToggleSubmit}
                  color="primary"
                  variant="contained"
                  style={{ marginBottom: '8px', marginRight: '8px' }}
                >
                  Submit
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default function Settings() {
  return (
    <LayoutMain title={<Trans>Settings</Trans>}>
      <Flex flexDirection="column" gap={3}>
        <SecurityCard />
      </Flex>
    </LayoutMain>
  );
}
