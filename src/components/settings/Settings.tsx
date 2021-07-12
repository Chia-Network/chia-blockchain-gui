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
} from '@material-ui/core';
import {
  Lock as LockIcon,
  NoEncryption as NoEncryptionIcon,
} from '@material-ui/icons';
import { openDialog } from '../../modules/dialog';
import { setKeyringPassphrase, changeKeyringPassphrase, removeKeyringPassphrase } from '../../modules/daemon_messages';

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
  let toggle_passphrase_input: null;
  let oldpass1_input: HTMLInputElement;
  let oldpass2_input: HTMLInputElement;
  let newpass_input: HTMLInputElement;
  let passphraseStatus = useSelector(
    (state) => state.daemon_state.passphrase_status,
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
    if (passphraseStatus) {
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
    if (passphraseStatus) {
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
    if (passphraseStatus) {
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
    if (passphraseStatus) {
      return (
        <DialogContentText>Enter your current passphrase:</DialogContentText>
      )
    } else {
      return (
        <DialogContentText>Enter a new passphrase:</DialogContentText>
      )
    }
  }

  function DisplayChangePassphrase() {
    // if (passphraseStatus) {
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
              <DialogContentText>Enter your current passphrase:</DialogContentText>
              <TextField
                autoFocus
                color="secondary"
                margin="dense"
                id="passphrase_input"
                inputRef={(input) => {
                  oldpass1_input = input;
                }}
                label={<Trans>Old Passphrase</Trans>}
                type="password"
                fullWidth
              />
              <TextField
                autoFocus
                color="secondary"
                margin="dense"
                id="passphrase_input"
                inputRef={(input) => {
                  oldpass2_input = input;
                }}
                label={<Trans>Re-enter Old Passphrase</Trans>}
                type="password"
                fullWidth
              />
              <TextField
                autoFocus
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
    // }
    // else {
      // return (null);
    // }
  }

  function handleToggleSubmit() {
    if (passphraseStatus) {
      dispatch(removeKeyringPassphrase(toggle_passphrase_input.value))
    }
    else {
      dispatch(setKeyringPassphrase(toggle_passphrase_input.value))
    }
  }

  function handleChangeSubmit() {
    if (oldpass1_input.value !== oldpass2_input.value) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Your inputs for old passphrase do not match</Trans>
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
    dispatch(changeKeyringPassphrase(oldpass2_input.value, newpass_input.value));
  }

  return (
    <Card title={<Trans>Passphrase Settings</Trans>}>
      <Grid spacing={4} container>
        <Grid item xs={12}>
          <Box display="flex" className={classes.passToggleBox}>
            {passphraseStatus ? (
              <LockIcon style={{ color: '#3AAC59',  marginRight: 6 }} />
            ) : (
              <NoEncryptionIcon style={{ color: 'red',  marginRight: 6 }} />
            )}
            <Typography variant="subtitle1" style={{ marginRight: 6 }}>Passphrase protection is </Typography>
            {passphraseStatus ? (
              <Typography variant="subtitle1">enabled</Typography>
            ) : (
              <Typography variant="subtitle1">disabled</Typography>
            )}
          </Box>
          <Box display="flex" className={classes.passChangeBox}>
            {passphraseStatus ? (
              <Button
                onClick={handleToggleOpen}
                className={classes.togglePassButton}
                variant="contained"
                color="secondary"
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
          <DisplayChangePassphrase />
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
