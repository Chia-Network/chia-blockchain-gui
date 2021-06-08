import React from 'react';
import { Trans } from '@lingui/macro';
import LayoutMain from '../layout/LayoutMain';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch } from 'react-redux';
import {
  Flex,
  Card,
} from '@chia/core';
import {
  Grid,
  Typography,
  TextField,
  Box,
  Button,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
/*
import {
  toggle_passcode,
  update_passcode,
} from '../../../modules/message';
*/

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
    marginLeft: theme.spacing(2),
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
  let oldpass1_input: HTMLInputElement;
  let oldpass2_input: HTMLInputElement;
  let newpass_input: HTMLInputElement;

  // const color = isPassActive ? '#3AAC59' : 'red';

  function togglePasscode() {
    console.log("TOGGLE PASS")
    // dispatch(toggle_passcode());
  }

  function updatePasscode() {
    console.log("UPDATE PASS")
    // dispatch(update_passcode(oldpass1, oldpass2, newpass));
  }

  return (
    <Card title={<Trans>Passcode Settings</Trans>}>
      <Grid spacing={4} container>
        <Grid item xs={12}>
          <Box display="flex" className={classes.passToggleBox}>
            <Typography variant="subtitle1" style={{ marginRight: 6 }}>Passcode is currently:</Typography>
            <Typography variant="subtitle1" style={{ color: '#3AAC59' }}> ON </Typography>
            /
            <Typography variant="subtitle1" style={{ color: 'red' }}> OFF</Typography>
            <Button
              onClick={togglePasscode}
              className={classes.togglePassButton}
              variant="contained"
              color="secondary"
              disableElevation
            >
              Toggle
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1">Change Passcode:</Typography>
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
                label={<Trans>Old Passcode</Trans>}
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
                label={<Trans>Re-enter Old Passcode</Trans>}
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
                label={<Trans>New Passcode</Trans>}
              />
            </Box>
            <Box>
              <Button
                onClick={updatePasscode}
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
