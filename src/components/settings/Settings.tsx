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
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
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

  const [open, setOpen] = React.useState(false);

  const handleToggleOpen = () => {
    setOpen(true);
  };

  const handleToggleClose = () => {
    setOpen(false);
  };

  function DisplayLockStatus() {
    if (passphraseStatus) {
      return (
        <Typography variant="subtitle1" style={{ color: '#3AAC59', fontWeight: "bold" }}> ON </Typography>
      )
    }
    else {
      return (
        <Typography variant="subtitle1" style={{ color: 'red', fontWeight: "bold" }}> OFF</Typography>
      )
    }
  }

  function DisplayToggleStatus() {
    if (passphraseStatus) {
      return (
        <Typography> TOGGLE OFF </Typography>
      )
    }
    else {
      return (
        <Typography> TOGGLE ON </Typography>
      )
    }
  }

  function DisplayDialogTextStatus() {
    if (passphraseStatus) {
      return (
        <DialogTitle id="form-dialog-title"> Enter your current passphrase: </DialogTitle>
      )
    }
    else {
      return (
        <DialogTitle id="form-dialog-title"> Enter a new passphrase: </DialogTitle>
      )
    }
  }

  function handleToggleSubmit() {
    if (passphraseStatus) {
      dispatch(removeKeyringPassphrase(toggle_passphrase_input.value))
    }
    else {
      dispatch(setKeyringPassphrase(toggle_passphrase_input.value))
    }
  }

  function updatePassphrase() {
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
            <Typography variant="subtitle1" style={{ marginRight: 6 }}>Passphrase is currently:</Typography>
            <DisplayLockStatus />
            <Button
              onClick={handleToggleOpen}
              className={classes.togglePassButton}
              variant="contained"
              color="secondary"
              disableElevation
            >
              <DisplayToggleStatus />
            </Button>
            <Dialog
              open={open}
              aria-labelledby="form-dialog-title"
              fullWidth={true}
              maxWidth = {'xs'}
            >
              <DisplayDialogTextStatus />
              <DialogContent>
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
        <Grid item xs={12}>
          <Typography variant="subtitle1">Change Passphrase:</Typography>
          <Box display="flex" className={classes.passChangeBox}>
            <Box flexGrow={6}>
              <TextField
                id="filled-secondary"
                variant="filled"
                color="secondary"
                input type="password"
                fullWidth
                className={classes.oldPass}
                inputRef={(input) => {
                  oldpass1_input = input;
                }}
                label={<Trans>Old Passphrase</Trans>}
              />
            </Box>
            <Box flexGrow={6}>
              <TextField
                id="filled-secondary"
                variant="filled"
                color="secondary"
                input type="password"
                fullWidth
                inputRef={(input) => {
                  oldpass2_input = input;
                }}
                label={<Trans>Re-enter Old Passphrase</Trans>}
              />
            </Box>
          </Box>
          <Box display="flex" className={classes.passChangeBox}>
            <Box flexGrow={6}>
              <TextField
                id="filled-secondary"
                variant="filled"
                color="secondary"
                input type="password"
                fullWidth
                inputRef={(input) => {
                  newpass_input = input;
                }}
                label={<Trans>New Passphrase</Trans>}
              />
            </Box>
            <Box>
              <Button
                onClick={updatePassphrase}
                className={classes.updatePassButton}
                variant="contained"
                color="primary"
              >
                Update
              </Button>
            </Box>
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
