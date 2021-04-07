import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Trans } from '@lingui/macro';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { AlertDialog, Card, Flex, } from '@chia/core';
import { Dropzone } from '@chia/core';

import {
  did_generate_backup_file,
  did_spend,
  did_update_recovery_ids_action,
  did_create_attest,
  did_recovery_spend,
  did_get_recovery_info
} from '../../../modules/message';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Tooltip } from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import { mojo_to_chia_string } from '../../../util/chia';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { openDialog } from '../../../modules/dialog';
import useCurrencyCode from '../../../hooks/useCurrencyCode';
import WalletHistory from '../WalletHistory';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  front: {
    zIndex: '100',
  },
  root: {
    display: 'flex',
    paddingLeft: '0px',
  },
  resultSuccess: {
    color: 'green',
  },
  resultFailure: {
    color: 'red',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(0),
    paddingBottom: theme.spacing(0),
    paddingRight: theme.spacing(0),
  },
  paper: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  drawerWallet: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    height: '100%',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  balancePaper: {
    marginTop: theme.spacing(2),
  },
  sendButton: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    width: 150,
    height: 50,
  },
  sendButtonSide: {
    marginLeft: theme.spacing(6),
    marginRight: theme.spacing(2),
    height: 56,
    width: 150,
  },
  copyButton: {
    marginTop: theme.spacing(0),
    marginBottom: theme.spacing(0),
    width: 70,
    height: 56,
  },
  subCard: {
    height: 100,
  },
  cardTitle: {
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  cardSubSection: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(1),
  },
  setupSection: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(1),
  },
  setupTitle: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(0),
  },
  input: {
    marginLeft: theme.spacing(3),
    height: 56,
  },
  inputLeft: {
    marginLeft: theme.spacing(3),
    height: 56,
  },
  inputRight: {
    marginRight: theme.spacing(3),
    marginLeft: theme.spacing(6),
    height: 56,
  },
  inputTitleLeft: {
    marginLeft: theme.spacing(0),
    marginBottom: theme.spacing(0),
    width: 400,
  },
  inputTitleRight: {
    marginLeft: theme.spacing(3),
    width: 400,
  },
  updateDIDsTitle: {
    marginTop: theme.spacing(3),
  },
  inputDIDs: {
    paddingTop: theme.spacing(0),
    marginLeft: theme.spacing(0),
  },
  inputDID: {
    marginLeft: theme.spacing(0),
    marginBottom: theme.spacing(2),
    width: '50%',
    height: 56,
  },
  walletContainer: {
    marginBottom: theme.spacing(5),
  },
  table_root: {
    width: '100%',
    maxHeight: 600,
    overflowY: 'scroll',
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  table: {
    height: '100%',
    overflowY: 'scroll',
  },
  tableBody: {
    height: '100%',
    overflowY: 'scroll',
  },
  row: {
    width: 700,
  },
  cell_short: {
    fontSize: '14px',
    width: 50,
    overflowWrap: 'break-word' /* Renamed property in CSS3 draft spec */,
  },
  leftField: {
    paddingRight: 20,
  },
  submitButton: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    width: 150,
    height: 50,
  },
  ul: {
    listStyle: 'none',
  },
  addButton: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    height: 56,
    width: 50,
  },
  sideButton: {
    marginTop: theme.spacing(0),
    marginBottom: theme.spacing(2),
    width: 50,
    height: 56,
  },
}));

const RecoveryCard = (props) => {
  const id = props.wallet_id;
  const mydid = useSelector(
    (state) => state.wallet_state.wallets[id].mydid,
  );
  let didcoin = useSelector(
    (state) => state.wallet_state.wallets[id].didcoin,
  );
  let did_rec_pubkey = useSelector(
    (state) => state.wallet_state.wallets[id].did_rec_pubkey,
  );
  let did_rec_puzhash = useSelector(
    (state) => state.wallet_state.wallets[id].did_rec_puzhash,
  );
  let backup_did_list = useSelector(
    (state) => state.wallet_state.wallets[id].backup_dids,
  );
  let dids_num_req = useSelector(
    (state) => state.wallet_state.wallets[id].dids_num_req,
  );
  const classes = useStyles();
  const dispatch = useDispatch();

  const [files, setFiles] = useState([]);

  const handleRemoveFile = (e) => {
    const name = e.target.getAttribute("name")
    setFiles(files.filter(object => object !== name));
  }

  function handleDrop(acceptedFiles) {
    setFiles([...files, acceptedFiles[0].path]);
  }

  const testpubkey = "817ec0759fb181f90a94d9fc679906959991348bc0e7eaa4dbb4d8a007a1804d79999a865841dc383eaeb954c4b31479"
  const testpuzhash = "fc34a72937dccd22a3bf2f3eb7f89f9fa683a855e4a3a8396058d555ce4152ae"

  function submit() {
    if (
      files.length < dids_num_req
    ) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Your DID requires at least {dids_num_req} attestation file(s) for recovery. Please upload additional files.</Trans>
          </AlertDialog>
        ),
      );
      return;
    } else {
      dispatch(did_recovery_spend(id, files));
    }
  }

  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className={classes.cardTitle}>
            <Typography component="h6" variant="h6">
              Recover DID Wallet
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 20 }}>
                <Typography variant="subtitle1">My DID:</Typography>
              </Box>
              <Box
                style={{
                  paddingLeft: 20,
                  width: '80%',
                  overflowWrap: 'break-word',
                }}
              >
                <Typography variant="subtitle1">{mydid}</Typography>
              </Box>
            </Box>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 20 }}>
                <Typography variant="subtitle1">Coin Name:</Typography>
              </Box>
              <Box
                style={{
                  paddingLeft: 20,
                  width: '80%',
                  overflowWrap: 'break-word',
                }}
              >
                <Typography variant="subtitle1">{didcoin}</Typography>
              </Box>
            </Box>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 20 }}>
                <Typography variant="subtitle1">Pubkey:</Typography>
              </Box>
              <Box
                style={{
                  paddingLeft: 20,
                  width: '80%',
                  overflowWrap: 'break-word',
                }}
              >
                <Typography variant="subtitle1">{did_rec_pubkey}</Typography>
              </Box>
            </Box>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 20 }}>
                <Typography variant="subtitle1">Puzzlehash:</Typography>
              </Box>
              <Box
                style={{
                  paddingLeft: 20,
                  width: '80%',
                  overflowWrap: 'break-word',
                }}
              >
                <Typography variant="subtitle1">{did_rec_puzhash}</Typography>
              </Box>
            </Box>
          </div>
        </Grid>
        <ViewDIDsSubsection
          backup_did_list={backup_did_list}
          dids_num_req={dids_num_req}
        />
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 10, marginTop: 30 }}>
                <Typography variant="subtitle1">
                  Input Attestation Packets:
                </Typography>
              </Box>
            </Box>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Dropzone onDrop={handleDrop}>
            <Trans>
              Drag and drop attestation packet(s)
            </Trans>
          </Dropzone>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 10, marginTop: 30 }}>
                <Typography variant="subtitle1">
                  Attestation Packets:
                </Typography>
              </Box>
            </Box>
            <Box>
              <Box flexGrow={1} style={{ marginBottom: 10 }}>
                {files.map(object => {
                  return (
                    <Typography key={object} variant="subtitle1">
                      <span> {object} </span>
                      <span name={object} onClick={handleRemoveFile} style={{textAlign: 'right'}}> [X] </span>
                    </Typography>
                  );
                })}
              </Box>
            </Box>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 10 }}>
                <Button
                  onClick={submit}
                  className={classes.sendButton}
                  variant="contained"
                  color="primary"
                >
                  <Trans>Submit</Trans>
                </Button>
              </Box>
            </Box>
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

const MyDIDCard = (props) => {
  const id = props.wallet_id;
  const mydid = useSelector((state) => state.wallet_state.wallets[id].mydid);
  let filename_input = null;
  const classes = useStyles();
  const dispatch = useDispatch();

  function generateBackup() {
    let filename = filename_input.value;
    dispatch(did_generate_backup_file(id, filename));
  }

  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className={classes.cardTitle}>
            <Typography component="h6" variant="h6">
              My DID
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box flexGrow={1} style={{ marginBottom: 20 }}>
                <Typography variant="subtitle1">My DID:</Typography>
              </Box>
              <Box
                style={{
                  paddingLeft: 20,
                  width: '80%',
                  overflowWrap: 'break-word',
                }}
              >
                <Typography variant="subtitle1">{mydid}</Typography>
              </Box>
            </Box>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box
                flexGrow={6}
                className={classes.inputTitleLeft}
                style={{ marginBottom: 10 }}
              >
                <Typography variant="subtitle1">
                  Generate a backup file:
                </Typography>
              </Box>
            </Box>
          </div>
          <div className={classes.subCard}>
            <Box display="flex">
              <Box flexGrow={1}>
                <TextField
                  className={classes.input}
                  variant="filled"
                  color="secondary"
                  fullWidth
                  inputRef={(input) => {
                    filename_input = input;
                  }}
                  label="Filename"
                />
              </Box>
              <Box>
                <Button
                  onClick={generateBackup}
                  className={classes.sendButtonSide}
                  variant="contained"
                  color="primary"
                >
                  Generate
                </Button>
              </Box>
            </Box>
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

const BalanceCardSubSection = (props) => {
  const currencyCode = useCurrencyCode();
  const classes = useStyles();
  return (
    <Grid item xs={12}>
      <div className={classes.cardSubSection}>
        <Box display="flex">
          <Box flexGrow={1}>
            <Typography variant="subtitle1">
              {props.title}
              {props.tooltip ? (
                <Tooltip title={props.tooltip}>
                  <HelpIcon
                    style={{ color: '#c8c8c8', fontSize: 12 }}
                  ></HelpIcon>
                </Tooltip>
              ) : (
                ''
              )}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">
              {mojo_to_chia_string(props.balance)} TXCH
            </Typography>
          </Box>
        </Box>
      </div>
    </Grid>
  );
};

const BalanceCard = (props) => {
  var id = props.wallet_id;
  const balance = useSelector(
    (state) => state.wallet_state.wallets[id].balance_total,
  );
  var balance_spendable = useSelector(
    (state) => state.wallet_state.wallets[id].balance_spendable,
  );
  const balance_pending = useSelector(
    (state) => state.wallet_state.wallets[id].balance_pending,
  );
  const balance_change = useSelector(
    (state) => state.wallet_state.wallets[id].balance_change,
  );
  const balance_ptotal = balance + balance_pending;
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className={classes.cardTitle}>
            <Typography component="h6" variant="h6">
              Balance
            </Typography>
          </div>
        </Grid>
        <BalanceCardSubSection
          title="Total Balance"
          balance={balance}
          tooltip=""
        />
        <BalanceCardSubSection
          title="Spendable Balance"
          balance={balance_spendable}
          tooltip={''}
        />
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box flexGrow={1}>
                <Accordion className={classes.front}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                  >
                    <Typography className={classes.heading}>
                      View pending balances
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={0}>
                      <BalanceCardSubSection
                        title="Pending Total Balance"
                        balance={balance_ptotal}
                        tooltip={''}
                      />
                      <BalanceCardSubSection
                        title="Pending Balance"
                        balance={balance_pending}
                        tooltip={''}
                      />
                      <BalanceCardSubSection
                        title="Pending Change"
                        balance={balance_change}
                        tooltip={''}
                      />
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Box>
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

const ViewDIDsSubsection = (props) => {
  const classes = useStyles();
  let backup_list = props.backup_did_list;
  let dids_num_req = props.dids_num_req;
  let dids_length = backup_list.length;
  let isEmptyList = false;
  if (backup_list.length === 0) {
    isEmptyList = true;
  }
  return (
    <Grid item xs={12}>
      <div className={classes.cardSubSection}>
        <Box display="flex">
          <Box flexGrow={1}>
            <Accordion className={classes.front}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography className={classes.heading}>
                  View backup DID list ({dids_num_req}/{dids_length} required
                  for recovery)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid item xs={12}>
                  <div className={classes.cardSubSection}>
                    <Box display="flex">
                      <Box flexGrow={1}>
                        <Typography variant="subtitle1">
                          {isEmptyList
                            ? 'Your backup list is currently empty.'
                            : null}
                          {backup_list.map((object, i) => {
                            return (
                              <span key={i}>
                                <Typography variant="subtitle1">
                                  &#8226; {object}
                                </Typography>
                              </span>
                            );
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </div>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      </div>
    </Grid>
  );
};

const ManageDIDsCard = (props) => {
  var id = props.wallet_id;
  const classes = useStyles();
  const dispatch = useDispatch();
  var pending = useSelector((state) => state.create_options.pending);
  var created = useSelector((state) => state.create_options.created);
  let backup_did_list = useSelector(
    (state) => state.wallet_state.wallets[id].backup_dids,
  );
  let dids_num_req = useSelector(
    (state) => state.wallet_state.wallets[id].dids_num_req,
  );
  const { handleSubmit, control } = useForm();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'backup_dids',
  });

  const onSubmit = (data) => {
    const didArray = data.backup_dids?.map((item) => item.backupid) ?? [];
    const cleanDidArray = didArray.filter(function (e) {
      return e !== '';
    });
    const num_verifications_required = parseInt(1);
    dispatch(
      did_update_recovery_ids_action(
        id,
        cleanDidArray,
        num_verifications_required,
      ),
    );
  };

  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className={classes.cardTitle}>
            <Typography component="h6" variant="h6">
              Manage Recovery DIDs
            </Typography>
          </div>
        </Grid>
        <ViewDIDsSubsection
          backup_did_list={backup_did_list}
          dids_num_req={dids_num_req}
        />
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box display="flex">
                <Box flexGrow={6} className={classes.updateDIDsTitle}>
                  <Typography variant="subtitle1">
                    Update Backup DIDs
                  </Typography>
                </Box>
              </Box>
              <Box display="flex">
                <Box flexGrow={1}>
                  <Button
                    type="button"
                    className={classes.sendButton}
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      append({ backupid: 'Backup ID' });
                    }}
                  >
                    ADD
                  </Button>
                </Box>
                <Box>
                  <Button
                    type="submit"
                    className={classes.sendButton}
                    variant="contained"
                    color="primary"
                  >
                    Submit
                  </Button>
                </Box>
              </Box>
              <Box display="flex">
                <Box flexGrow={1} className={classes.inputDIDs}>
                  <ul>
                    {fields.map((item, index) => {
                      return (
                        <li key={item.id} style={{ listStyleType: 'none' }}>
                          <Controller
                            as={TextField}
                            name={`backup_dids[${index}].backupid`}
                            control={control}
                            defaultValue=""
                            label="Backup ID"
                            variant="filled"
                            color="secondary"
                            className={classes.inputDID}
                          />
                          <Button
                            type="button"
                            className={classes.sideButton}
                            variant="contained"
                            color="secondary"
                            disableElevation
                            onClick={() => remove(index)}
                          >
                            Delete
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </Box>
              </Box>
            </form>
          </div>
        </Grid>
        <Backdrop className={classes.backdrop} open={pending && created}>
          <CircularProgress color="inherit" />
        </Backdrop>
      </Grid>
    </Paper>
  );
};

const CreateAttest = (props) => {
  const id = props.wallet_id;
  let filename_input = null;
  let coin_input = null;
  let pubkey_input = null;
  let puzhash_input = null;
  const classes = useStyles();
  const dispatch = useDispatch();

  function createAttestPacket() {
    let filename = filename_input.value;
    if (coin_input.value === '') {
      dispatch(openDialog('Please enter a valid coin'));
      return;
    }
    if (pubkey_input.value === '') {
      dispatch(openDialog('Please enter a valid pubkey'));
      return;
    }
    if (puzhash_input.value === '') {
      dispatch(openDialog('Please enter a valid puzzlehash'));
      return;
    }
    let address = puzhash_input.value.trim();
    if (address.substring(0, 12) === 'chia_addr://') {
      address = address.substring(12);
    }
    if (address.startsWith('0x') || address.startsWith('0X')) {
      address = address.substring(2);
    }

    dispatch(did_create_attest(id, filename, coin_input.value, pubkey_input.value, address));

    coin_input.value = '';
    pubkey_input.value = '';
    puzhash_input.value = '';
  }

  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className={classes.cardTitle}>
            <Typography component="h6" variant="h6">
              Create An Attest
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box flexGrow={1}>
                <TextField
                  variant="filled"
                  color="secondary"
                  margin="normal"
                  fullWidth
                  inputRef={(input) => {
                    filename_input = input;
                  }}
                  label="Filename"
                />
              </Box>
              <Box></Box>
            </Box>
            <Box display="flex">
              <Box flexGrow={1}>
                <TextField
                  variant="filled"
                  color="secondary"
                  margin="normal"
                  fullWidth
                  inputRef={(input) => {
                    coin_input = input;
                  }}
                  label="Coin"
                />
              </Box>
              <Box></Box>
            </Box>
            <Box display="flex">
              <Box flexGrow={1}>
                <TextField
                  variant="filled"
                  color="secondary"
                  margin="normal"
                  fullWidth
                  inputRef={(input) => {
                    pubkey_input = input;
                  }}
                  label="Pubkey"
                />
              </Box>
              <Box></Box>
            </Box>
            <Box display="flex">
              <Box flexGrow={1}>
                <TextField
                  variant="filled"
                  color="secondary"
                  margin="normal"
                  fullWidth
                  inputRef={(input) => {
                    puzhash_input = input;
                  }}
                  label="Puzzlehash"
                />
              </Box>
              <Box></Box>
            </Box>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box>
                <Button
                  onClick={createAttestPacket}
                  className={classes.sendButton}
                  variant="contained"
                  color="primary"
                >
                  Create Attest
                </Button>
              </Box>
            </Box>
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

const CashoutCard = (props) => {
  var id = props.wallet_id;
  var address_input = null;
  const classes = useStyles();
  const dispatch = useDispatch();

  function cashout() {
    let puzzlehash = address_input.value.trim();

    if (puzzlehash.startsWith('0x') || puzzlehash.startsWith('0X')) {
      puzzlehash = puzzlehash.substring(2);
    }

    dispatch(did_spend(id, puzzlehash));
    address_input.value = '';
  }

  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className={classes.cardTitle}>
            <Typography component="h6" variant="h6">
              Cash Out
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box flexGrow={1}>
                <TextField
                  variant="filled"
                  color="secondary"
                  fullWidth
                  inputRef={(input) => {
                    address_input = input;
                  }}
                  label="Address / Puzzle hash"
                />
              </Box>
              <Box></Box>
            </Box>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.cardSubSection}>
            <Box display="flex">
              <Box>
                <Button
                  onClick={cashout}
                  className={classes.sendButton}
                  variant="contained"
                  color="primary"
                >
                  Cash Out
                </Button>
              </Box>
            </Box>
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

const HistoryCard = (props) => {
  var id = props.wallet_id;
  const classes = useStyles();
  return (
    <Paper className={classes.paper}>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className={classes.cardTitle}>
            <Typography component="h6" variant="h6">
              History
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12}>
          <TransactionTable wallet_id={id}> </TransactionTable>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function DistributedIDWallet(props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const id = useSelector((state) => state.wallet_menu.id);
  const wallets = useSelector((state) => state.wallet_state.wallets);
  const data = useSelector((state) => state.wallet_state.wallets[id].data);
  const data_parsed = JSON.parse(data);
  let temp_coin = data_parsed.temp_coin;

  if (wallets.length > props.wallet_id) {
    if (temp_coin) {
      dispatch(did_get_recovery_info(id))
      return (
        <Flex flexDirection="column" gap={3}>
          <RecoveryCard wallet_id={id} />
        </Flex>
      );
    } else {
      return (
        <Flex flexDirection="column" gap={3}>
          <MyDIDCard wallet_id={id} />
          <BalanceCard wallet_id={id} />
          <ManageDIDsCard wallet_id={id} />
          <CreateAttest wallet_id={id} />
          <CashoutCard wallet_id={id} />
          <WalletHistory walletId={id} />
        </Flex>
      );
    }
  }

  return null;
}
