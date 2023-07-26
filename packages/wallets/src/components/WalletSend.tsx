import {
  useGetSyncStatusQuery,
  useSendTransactionMutation,
  useFarmBlockMutation,
  useLocalStorage,
} from '@chia-network/api-react';
import {
  Amount,
  ButtonLoading,
  EstimatedFee,
  FeeTxType,
  Form,
  TextField,
  Flex,
  Card,
  useOpenDialog,
  chiaToMojo,
  getTransactionResult,
  useIsSimulator,
  TooltipIcon,
  Button,
} from '@chia-network/core';
import { ConnectCheckmark } from '@chia-network/icons';
import { Trans, t } from '@lingui/macro';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { Grid, Typography, Accordion, AccordionDetails, AccordionSummary, Badge, Alert } from '@mui/material';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import isNumeric from 'validator/es/lib/isNumeric';

import useClawbackDefaultTime, { getClawbackTimeInSeconds } from '../hooks/useClawbackDefaultTime';
import useWallet from '../hooks/useWallet';
import AddressBookAutocomplete from './AddressBookAutocomplete';
import CreateWalletSendTransactionResultDialog from './WalletSendTransactionResultDialog';

type SendCardProps = {
  walletId: number;
};

type SendTransactionData = {
  address: string;
  amount: string;
  fee: string;
  memo: string;
  days: string | number;
  hours: string | number;
  minutes: string | number;
};

const fields = [
  { name: 'days', label: 'Days', max: 365 },
  { name: 'hours', label: 'Hours', max: 24 },
  { name: 'minutes', label: 'Minutes', max: 60 },
];

export default function WalletSend(props: SendCardProps) {
  const { walletId } = props;
  const [submissionCount, setSubmissionCount] = React.useState(0);
  const isSimulator = useIsSimulator();
  const openDialog = useOpenDialog();
  const [isMemoExpanded, setIsMemoExpanded] = React.useState<boolean>(false);
  const { clawbackDefaultTime, isClawbackDefaultTimeEnabled } = useClawbackDefaultTime();
  const [isClawbackExpanded, setIsClawbackExpanded] = React.useState<boolean>(isClawbackDefaultTimeEnabled);
  const [sendTransaction, { isLoading: isSendTransactionLoading }] = useSendTransactionMutation();
  const [farmBlock] = useFarmBlockMutation();
  const [, setSearchParams] = useSearchParams();
  const methods = useForm<SendTransactionData>({
    defaultValues: {
      address: '',
      amount: '',
      fee: '',
      memo: '',
      ...clawbackDefaultTime,
    },
  });

  const [wasClawbackSendTransactionVisited, setWasClawbackSendTransactionVisited] = useLocalStorage<boolean>(
    'newFlag--wasClawbackSendTransactionVisited',
    false
  );

  const {
    formState: { isSubmitting },
  } = methods;

  const addressValue = useWatch({
    control: methods.control,
    name: 'address',
  });

  const clawbackValues = useWatch({
    control: methods.control,
    name: ['days', 'hours', 'minutes'],
  });

  const willClawbackBeEnabled = clawbackValues.map((value) => Number(value)).some((value) => value > 0);

  const { data: walletState, isLoading: isWalletSyncLoading } = useGetSyncStatusQuery(
    {},
    {
      pollingInterval: 10_000,
    }
  );

  const { wallet } = useWallet(walletId);

  if (!wallet || isWalletSyncLoading) {
    return null;
  }

  const syncing = !!walletState?.syncing;

  async function farm() {
    if (addressValue) {
      await farmBlock({
        address: addressValue,
      }).unwrap();
    }
  }

  async function handleSubmit(data: SendTransactionData) {
    if (isSendTransactionLoading) {
      return;
    }

    if (syncing) {
      throw new Error(t`Please finish syncing before making a transaction`);
    }

    const amount = data.amount.trim();
    if (!isNumeric(amount)) {
      throw new Error(t`Please enter a valid numeric amount`);
    }

    const fee = data.fee.trim() || '0';
    if (!isNumeric(fee)) {
      throw new Error(t`Please enter a valid numeric fee`);
    }

    let { address } = data;
    if (address.includes('colour')) {
      throw new Error(t`Cannot send chia to coloured address. Please enter a chia address.`);
    }

    if (address.slice(0, 12) === 'chia_addr://') {
      address = address.slice(12);
    }
    if (address.startsWith('0x') || address.startsWith('0X')) {
      address = address.slice(2);
    }

    const memo = data.memo.trim();
    const memos = memo ? [memo] : undefined; // Avoid sending empty string

    const queryData = {
      walletId,
      address,
      amount: chiaToMojo(amount),
      fee: chiaToMojo(fee),
      waitForConfirmation: true,
    };

    if (memos) {
      queryData.memos = memos;
    }

    const clawbackSeconds = getClawbackTimeInSeconds(data);
    if (clawbackSeconds > 0) {
      queryData.puzzleDecorator = [
        {
          decorator: 'CLAWBACK',
          clawbackTimelock: clawbackSeconds,
        },
      ];
    }

    const response = await sendTransaction(queryData).unwrap();

    const result = getTransactionResult(response.transaction);
    const resultDialog = CreateWalletSendTransactionResultDialog({
      success: result.success,
      message: result.message,
    });

    if (resultDialog) {
      await openDialog(resultDialog);
    } else {
      throw new Error(result.message ?? 'Something went wrong');
    }

    methods.reset();
    // Workaround to force a re-render of the form. Without this, the fee field will not be cleared.
    setSubmissionCount((prev: number) => prev + 1);

    setSearchParams({ selectedTab: 'summary' });
  }

  return (
    <Form methods={methods} key={submissionCount} onSubmit={handleSubmit}>
      <Flex gap={2} flexDirection="column">
        <Typography variant="h6">
          <Trans>Create Transaction</Trans>
          &nbsp;
          <TooltipIcon>
            <Trans>
              On average there is one minute between each transaction block. Unless there is congestion you can expect
              your transaction to be included in less than a minute.
            </Trans>
          </TooltipIcon>
        </Typography>
        <Card>
          <Grid spacing={2} container>
            <Grid xs={12} item>
              <AddressBookAutocomplete
                name="address"
                getType="address"
                freeSolo
                variant="filled"
                required
                disabled={isSubmitting}
              />
            </Grid>
            <Grid xs={12} md={6} item>
              <Amount
                id="filled-secondary"
                variant="filled"
                color="secondary"
                name="amount"
                disabled={isSubmitting}
                label={<Trans>Amount</Trans>}
                data-testid="WalletSend-amount"
                required
                fullWidth
              />
            </Grid>
            <Grid xs={12} md={6} item>
              <EstimatedFee
                id="filled-secondary"
                variant="filled"
                name="fee"
                color="secondary"
                disabled={isSubmitting}
                label={<Trans>Fee</Trans>}
                data-testid="WalletSend-fee"
                fullWidth
                txType={FeeTxType.walletSendXCH}
              />
            </Grid>
            <Grid xs={12} item>
              <Accordion
                expanded={isClawbackExpanded}
                onChange={(_event, isExpanded: boolean) => {
                  if (!wasClawbackSendTransactionVisited) {
                    setWasClawbackSendTransactionVisited(true);
                  }
                  setIsClawbackExpanded(isExpanded);
                }}
                sx={{ boxShadow: 'none' }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon color="info" />}
                  aria-controls="panel2bh-content"
                  id="panel2bh-header"
                >
                  <Badge
                    badgeContent="New"
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        top: '10px',
                        right: '-25px',
                      },
                    }}
                    invisible={wasClawbackSendTransactionVisited}
                  >
                    <Typography variant="subtitle2">Add option to claw back transaction</Typography>
                  </Badge>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="info" sx={{ marginBottom: 3 }}>
                    <Trans>
                      - Set a time frame which allows you claw back (revoke) the transaction.
                      <br />- Recipient of the transaction can only claim the funds once that time frame expires.
                    </Trans>
                  </Alert>
                  <Flex gap={2}>
                    {fields.map((field) => (
                      <TextField
                        name={field.name}
                        key={field.name}
                        label={field.label}
                        type="number"
                        size="small"
                        InputProps={{
                          inputProps: {
                            min: 0,
                            step: 1,
                            max: field.max,
                          },
                        }}
                        data-testid={`WalletSend-${field.name}`}
                        sx={{ width: 100 }}
                      />
                    ))}
                    {willClawbackBeEnabled && (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          methods.setValue('days', 0);
                          methods.setValue('hours', 0);
                          methods.setValue('minutes', 0);
                        }}
                      >
                        <Trans>Disable</Trans>
                      </Button>
                    )}
                  </Flex>
                  {willClawbackBeEnabled && (
                    <>
                      <Alert severity="info" sx={{ marginTop: 3 }} icon={<ReportProblemOutlinedIcon />}>
                        <Trans>
                          Before sending this transaction, you should ensure that the recipient has a wallet with the
                          capability to claim it manually after the timer has expired.
                        </Trans>
                      </Alert>

                      <Flex gap={2} justifyContent="flex-start" sx={{ marginTop: 3 }} alignItems="center">
                        <Typography
                          component="div"
                          variant="subtitle2"
                          sx={(theme) => ({ color: theme.palette.primary.main })}
                        >
                          <ConnectCheckmark
                            sx={(theme) => ({
                              verticalAlign: 'middle',
                              position: 'relative',
                              top: '-5px',
                              left: '-7px',
                              width: '31px',
                              height: '31px',

                              circle: {
                                stroke: theme.palette.primary.main,
                                fill: theme.palette.primary.main,
                              },
                              path: {
                                stroke: theme.palette.primary.main,
                                fill: theme.palette.primary.main,
                              },
                            })}
                          />
                          <Trans>Clawback will be applied. </Trans>{' '}
                        </Typography>
                      </Flex>
                    </>
                  )}
                  {!willClawbackBeEnabled && (
                    <Typography component="div" variant="subtitle2" sx={{ width: '100%', marginTop: 3 }}>
                      <Trans>Clawback will not be applied. </Trans>{' '}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
              <Accordion
                expanded={isMemoExpanded}
                onChange={(_event, isExpanded: boolean) => {
                  setIsMemoExpanded(isExpanded);
                }}
                sx={{ boxShadow: 'none' }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon color="info" />}
                  aria-controls="panel1bh-content"
                  id="panel1bh-header"
                >
                  <Typography variant="subtitle2">Add transaction memo</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="info" sx={{ marginBottom: 3 }}>
                    - Memo helps the receiver side to identify the payment.
                    <br />- Anything you enter will be publicly accessible on the blockchain.
                  </Alert>

                  <TextField
                    name="memo"
                    variant="filled"
                    color="secondary"
                    fullWidth
                    disabled={isSubmitting}
                    label={<Trans>Memo</Trans>}
                    data-testid="WalletSend-memo"
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Card>
        <Flex justifyContent="flex-end" gap={1}>
          {isSimulator && (
            <Button onClick={farm} variant="outlined" data-testid="WalletSend-farm">
              <Trans>Farm</Trans>
            </Button>
          )}

          <ButtonLoading
            variant="contained"
            color="primary"
            type="submit"
            loading={isSendTransactionLoading}
            data-testid="WalletSend-send"
          >
            <Trans>Send</Trans>
          </ButtonLoading>
        </Flex>
      </Flex>
    </Form>
  );
}
