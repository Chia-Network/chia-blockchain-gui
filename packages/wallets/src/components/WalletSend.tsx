import { useGetSyncStatusQuery, useSendTransactionMutation, useFarmBlockMutation } from '@chia/api-react';
import {
  AdvancedOptions,
  Amount,
  ButtonLoading,
  EstimatedFee,
  Form,
  TextField,
  Flex,
  Card,
  useOpenDialog,
  chiaToMojo,
  getTransactionResult,
  useIsSimulator,
  TooltipIcon,
} from '@chia/core';
import { Trans, t } from '@lingui/macro';
import { Button, Grid, Typography } from '@mui/material';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import isNumeric from 'validator/es/lib/isNumeric';

import useWallet from '../hooks/useWallet';
import CreateWalletSendTransactionResultDialog from './WalletSendTransactionResultDialog';

type SendCardProps = {
  walletId: number;
};

type SendTransactionData = {
  address: string;
  amount: string;
  fee: string;
  memo: string;
};

export default function WalletSend(props: SendCardProps) {
  const { walletId } = props;
  const [submissionCount, setSubmissionCount] = React.useState(0);
  const isSimulator = useIsSimulator();
  const openDialog = useOpenDialog();
  const [sendTransaction, { isLoading: isSendTransactionLoading }] = useSendTransactionMutation();
  const [farmBlock] = useFarmBlockMutation();
  const methods = useForm<SendTransactionData>({
    defaultValues: {
      address: '',
      amount: '',
      fee: '',
      memo: '',
    },
  });

  const {
    formState: { isSubmitting },
  } = methods;

  const addressValue = useWatch<string>({
    control: methods.control,
    name: 'address',
  });

  const { data: walletState, isLoading: isWalletSyncLoading } = useGetSyncStatusQuery(
    {},
    {
      pollingInterval: 10000,
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
              <TextField
                name="address"
                variant="filled"
                color="secondary"
                fullWidth
                disabled={isSubmitting}
                label={<Trans>Address / Puzzle hash</Trans>}
                data-testid="WalletSend-address"
                required
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
                txType="walletSendXCH"
              />
            </Grid>
            <Grid xs={12} item>
              <AdvancedOptions>
                <TextField
                  name="memo"
                  variant="filled"
                  color="secondary"
                  fullWidth
                  disabled={isSubmitting}
                  label={<Trans>Memo</Trans>}
                  data-testid="WalletSend-memo"
                />
              </AdvancedOptions>
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
