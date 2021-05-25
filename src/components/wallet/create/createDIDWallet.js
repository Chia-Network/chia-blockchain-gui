import React from 'react';
import { Trans } from '@lingui/macro';
import { AlertDialog, Flex } from '@chia/core';
import {
  Typography,
  Button,
  Box,
  TextField,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import {
  createState,
  changeCreateWallet,
  CREATE_DID_WALLET_OPTIONS,
} from '../../../modules/createWallet';
import { useDispatch } from 'react-redux';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import { useStyles } from './WalletCreate';
import { create_did_action } from '../../../modules/message';
import { chia_to_mojo } from '../../../util/chia';
import { openDialog } from '../../../modules/dialog';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Help as HelpIcon } from '@material-ui/icons';

export const customStyles = makeStyles((theme) => ({
  input: {
    marginLeft: theme.spacing(3),
    height: 56,
  },
  inputLeft: {
    marginLeft: theme.spacing(3),
    width: '75%',
    height: 56,
  },
  inputDIDs: {
    paddingTop: theme.spacing(3),
    marginLeft: theme.spacing(0),
  },
  inputDID: {
    marginLeft: theme.spacing(0),
    marginBottom: theme.spacing(2),
  },
  inputRight: {
    marginRight: theme.spacing(3),
    marginLeft: theme.spacing(6),
    height: 56,
  },
  sendButton: {
    marginLeft: theme.spacing(6),
    marginRight: theme.spacing(2),
    height: 56,
    width: 150,
  },
  addButton: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    height: 56,
    width: 50,
  },
  card: {
    paddingTop: theme.spacing(10),
    height: 200,
  },
  topCard: {
    height: 100,
  },
  subCard: {
    height: 100,
  },
  topTitleCard: {
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(1),
  },
  titleCard: {
    paddingBottom: theme.spacing(1),
  },
  inputTitleLeft: {
    paddingTop: theme.spacing(3),
    marginLeft: theme.spacing(3),
    width: '50%',
  },
  inputTitleRight: {
    marginLeft: theme.spacing(3),
    width: '50%',
  },
  sideButton: {
    marginTop: theme.spacing(0),
    marginBottom: theme.spacing(2),
    height: 56,
  },
  numNeeded: {
    width: '50%',
    marginBottom: theme.spacing(2),
  },
  addID: {
    height: 56,
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(1),
    paddingRight: theme.spacing(2),
  },
  addText: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  addIDsText: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
  },
}));

export default function CreateDIDWallet() {
  const classes = useStyles();
  const custom = customStyles();
  const dispatch = useDispatch();

  const { handleSubmit, control } = useForm();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'backup_dids',
  });

  const onSubmit = (data) => {
    const didArray = data.backup_dids?.map((item) => item.backupid) ?? [];
    let uniqDidArray = Array.from(new Set(didArray));
    uniqDidArray = uniqDidArray.filter(item => item !== "")
    let amount_val = chia_to_mojo(data.amount);
    if (
      amount_val === '' ||
      Number(amount_val) === 0 ||
      !Number(amount_val) ||
      isNaN(Number(amount_val))
    ) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Please enter a valid numeric amount.</Trans>
          </AlertDialog>
        ),
      );
      return;
    }
    if (
      (amount_val) % 2 != 0
    ) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Amount must be an even amount.</Trans>
          </AlertDialog>
        ),
      );
      return;
    }
    let num_of_backup_ids_needed = data.num_needed;
    if (
      num_of_backup_ids_needed === '' ||
      isNaN(Number(num_of_backup_ids_needed))
    ) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Please enter a valid integer of 0 or greater for the number of Backup IDs needed for recovery.</Trans>
          </AlertDialog>
        ),
      );
      return;
    }
    if (
      num_of_backup_ids_needed > uniqDidArray.length
    )
    {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>The number of Backup IDs needed for recovery cannot exceed the number of Backup IDs added.</Trans>
          </AlertDialog>
        ),
      );
      return;
    }
    let amount_plus = amount_val + 1
    dispatch(createState(true, true));
    dispatch(create_did_action(amount_plus, uniqDidArray, num_of_backup_ids_needed));
  };

  function goBack() {
    dispatch(changeCreateWallet(CREATE_DID_WALLET_OPTIONS));
  }

  return (
    <Flex flexDirection="column" gap={3}>
      <Box display="flex">
        <Box>
          <Button onClick={goBack}>
            <ArrowBackIosIcon> </ArrowBackIosIcon>
          </Button>
        </Box>
        <Box flexGrow={1} className={classes.title}>
          <Typography component="h6" variant="h6">
            Create Distributed Identity Wallet
          </Typography>
        </Box>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box display="flex">
          <Flex alignItems="stretch" className={custom.addText}>
            <Typography variant="subtitle1">
              Enter amount:
            </Typography>
            <Tooltip title="The amount of Chia you enter must correspond to an even amount of mojos. One additional mojo will be added to the total amount for security purposes.">
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>
          </Flex>
        </Box>
        <Flex alignItems="center" gap="15px">
          <Box flexGrow={1}>
            <Controller
              as={TextField}
              name="amount"
              control={control}
              label="Amount"
              variant="outlined"
              fullWidth
              defaultValue=""
            />
          </Box>
          <Box display="flex" style={{ paddingRight: 5 }}>
            <Typography variant="subtitle1">
              + 1 mojo
            </Typography>
            <Tooltip title="This additional mojo will be added to the total amount for security purposes.">
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>
          </Box>
        </Flex>
        <Box display="flex">
          <Flex alignItems="stretch" className={custom.addText}>
            <Typography variant="subtitle1">
              Enter number of Backup IDs needed for recovery:
            </Typography>
            <Tooltip title="This number must be an integer greater than or equal to 0. It cannot exceed the number of Backup IDs added. You will be able to change this number as well as your list of Backup IDs.">
              <HelpIcon style={{ color: '#c8c8c8', fontSize: 12 }} />
            </Tooltip>
          </Flex>
        </Box>
        <Flex flexDirection="row" justifyContent="space-between">
          <Box flexGrow={6}>
            <Controller
              as={TextField}
              name="num_needed"
              control={control}
              label="Number of Backup IDs needed for recovery"
              variant="outlined"
              fullWidth
              defaultValue=""
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disableElevation
          >
            <Trans>Create</Trans>
          </Button>
        </Flex>
        <Box display="flex">
          <Box flexGrow={6} className={custom.addIDsText}>
            <Typography variant="subtitle1">
              Add Backup IDs:
            </Typography>
          </Box>
        </Box>
        <Flex alignItems="stretch">
          <Button
            onClick={() => {
              append({ backupid: 'Backup ID' });
            }}
            variant="contained"
            disableElevation
            className={custom.addID}
          >
            <Trans>Add Backup ID</Trans>
          </Button>
        </Flex>
        <ul>
          {fields.map((item, index) => {
            return (
              <li key={item.id} style={{ listStyleType: 'none' }}>
                <Flex alignItems="stretch">
                  <Box flexGrow={1}>
                    <Controller
                      as={TextField}
                      name={`backup_dids[${index}].backupid`}
                      control={control}
                      defaultValue=""
                      label="Backup ID"
                      variant="outlined"
                      fullWidth
                      color="secondary"
                      className={custom.inputDID}
                    />
                  </Box>
                  <Button
                    onClick={() => remove(index)}
                    variant="contained"
                    disableElevation
                    className={custom.sideButton}
                  >
                    <Trans>Delete</Trans>
                  </Button>
                </Flex>
              </li>
            );
          })}
        </ul>
      </form>
    </Flex>
  );
}
