import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Trans } from '@lingui/macro';
import moment from 'moment';
import { Switch, Route, useHistory, useRouteMatch } from 'react-router-dom';
import {
  Back,
  Card,
  CardHero,
  ConfirmDialog,
  Fee,
  Flex,
  Form,
  More,
  TableControlled,
  TooltipIcon,
  useOpenDialog,
} from '@chia/core';
import { OfferSummary, OfferTradeRecord } from '@chia/api';
import {
  mojo_to_chia_string,
  mojo_to_colouredcoin_string,
} from '../../../util/chia';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  ListItemIcon,
  MenuItem,
  Typography
} from '@material-ui/core';
import { Cancel, GetApp as Download } from '@material-ui/icons';
import { Trade as TradeIcon } from '@chia/icons';
import { suggestedFilenameForOffer } from './utils';
import { useCancelOfferMutation, useGetAllOffersQuery, useGetOfferDataMutation } from '@chia/api-react';
import { CreateOfferEditor } from './OfferEditor';
import { OfferImport } from './OfferImport';
import fs from 'fs';

const StyledTradeIcon = styled(TradeIcon)`
  font-size: 4rem;
`;

type OfferCancellationOptions = {
  cancelWithTransaction: boolean;
  cancellationFee: number;
};

type ConfirmOfferCancellationProps = {
  onUpdateValues: (values: OfferCancellationOptions) => void;
};

function ConfirmOfferCancellation(props: ConfirmOfferCancellationProps) {
  const { onUpdateValues } = props;
  const methods = useForm({
    defaultValues: {
      cancelWithTransaction: false,
      fee: '',
    }
  });
  const { watch } = methods;
  const fee = watch('fee');
  const [cancelWithTransaction, setCancelWithTransaction] = useState<boolean>(false);

  // Communicate value updates to the parent component
  useEffect(() => {
    onUpdateValues({ cancelWithTransaction, cancellationFee: (fee ? parseFloat(fee) : 0) });
  }, [cancelWithTransaction, fee]);

  return (
    <Form methods={methods}>
      <Flex flexDirection="column" gap={3}>
        <Typography variant="body1">
          <Trans>
            Are you sure you want to cancel your offer?
          </Trans>
        </Typography>
        <Typography variant="body1">
          <Trans>
            If you have already shared your offer file,
            you may need to submit a transaction to cancel
            the pending offer. Click "Cancel on blockchain"
            to submit a cancellation transaction.
          </Trans>
        </Typography>
        <Flex flexDirection="row" gap={3}>
          <Grid container>
            <Grid xs={6} item>
              <FormControlLabel
                control={<Checkbox name="cancelWithTransaction" onChange={(event) => setCancelWithTransaction(event.target.checked)} />}
                label={
                  <>
                    <Trans>Cancel on blockchain</Trans>{' '}
                    <TooltipIcon>
                      <Trans>
                        Creates and submits a transaction on the blockchain that cancels the offer
                      </Trans>
                    </TooltipIcon>
                  </>
                  }
              />
            </Grid>
            { cancelWithTransaction && (
              // <Typography>Test</Typography>
              <Grid xs={6} item>
                <Fee
                  id="filled-secondary"
                  variant="filled"
                  name="fee"
                  color="secondary"
                  label={<Trans>Fee</Trans>}
                  fullWidth
                />
              </Grid>
            )}
          </Grid>
        </Flex>
      </Flex>
    </Form>
  );
}

function formatOfferEntry(assetId: string, amount: string | number): string {
  let amountString = '';
  if (assetId === 'xch') {
    amountString = `${mojo_to_chia_string(amount)} XCH`;
  }
  else {
    amountString = `${mojo_to_colouredcoin_string(amount)} CC`;
  }
  return amountString;
}

function formatOfferSummary(summary: OfferSummary): string {
  const offers: string[] = Object.entries(summary.offered).map(([assetId, amount]) => formatOfferEntry(assetId, amount));
  const requests: string[] = Object.entries(summary.requested).map(([assetId, amount]) => formatOfferEntry(assetId, amount));
  const summaryString = `${offers.join(', ')} <-> ${requests.join(', ')}`;
  return summaryString;
}

function OfferList() {
  const { data, loading, error } = useGetAllOffersQuery();
  const [getOfferData] = useGetOfferDataMutation();
  const [cancelOffer] = useCancelOfferMutation();
  const openDialog = useOpenDialog();

  async function handleExportOffer(tradeId: string) {
    const { data: response } = await getOfferData(tradeId);
    const { offer: offerData, tradeRecord, success } = response;
    if (success === true) {
      const dialogOptions = {
        defaultPath: suggestedFilenameForOffer(tradeRecord),
      }
      const result = await window.remote.dialog.showSaveDialog(dialogOptions);
      const { filePath, canceled } = result;

      if (!canceled && filePath) {
        try {
          fs.writeFileSync(filePath, offerData);
        }
        catch (err) {
          console.error(err);
        }
      }
    }
  }

  async function handleCancelOffer(tradeId: string) {
    let options: OfferCancellationOptions = {
      cancelWithTransaction: false,
      cancellationFee: 0,
    };
    const cancelConfirmed = await openDialog(
      <ConfirmDialog
        title={<Trans>Cancel Offer</Trans>}
        confirmTitle={<Trans>Cancel Offer</Trans>}
        confirmColor="danger"
        cancelTitle={<Trans>Close</Trans>}
      >
        <ConfirmOfferCancellation
          onUpdateValues={(values) => options = values}
        />
      </ConfirmDialog>
    );

    console.log("cancelConfirmed:");
    console.log(cancelConfirmed);
    console.log("options");
    console.log(options);

    if (cancelConfirmed === true) {
      const response = await cancelOffer({ tradeId, secure: options.cancelWithTransaction, fee: options.cancellationFee });
      console.log("response");
      console.log(response);
    }
  }

  const tradeRecords: any[] = useMemo(() => {
    if (loading || !data) {
      return [];
    }
    return data;
  }, [data, loading]);

  const cols = useMemo(() => {
    return [
      {
        field: (row: Row) => {
          const { status } = row;

          return (
            <Typography color="textSecondary" variant="body2">
              {status}
            </Typography>
          );
        },
        title: <Trans>Status</Trans>
      },
      {
        field: (row: Row) => {
          const summary = formatOfferSummary(row.summary);

          return  (
            <Typography color="textSecondary" variant="body2">
              {summary}
            </Typography>
          );
        },
        title: <Trans>Summary</Trans>
      },
      {
        field: (row: Row) => {
          const { createdAtTime } = row;

          return (
            <Typography color="textSecondary" variant="body2">
              {moment(createdAtTime * 1000).format('LLL')}
            </Typography>
          );
        },
        title: <Trans>Creation Date</Trans>,
      },
      {
        field: (row: Row) => {
          const { tradeId } = row;

          return (
            <More>
              {({ onClose }: { onClose: () => void }) => (
                <Box>
                  <MenuItem
                    onClick={() => {
                      onClose();
                      handleExportOffer(tradeId);
                    }}
                  >
                    <ListItemIcon>
                      <Download fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="inherit" noWrap>
                      <Trans>Export Offer File</Trans>
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      onClose();
                      handleCancelOffer(tradeId);
                    }}
                  >
                    <ListItemIcon>
                      <Cancel fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="inherit" noWrap>
                      <Trans>Cancel Offer</Trans>
                    </Typography>
                  </MenuItem>
                </Box>
              )}
            </More>
          );
        },
        title: <Trans>Actions</Trans>
      },
    ];
  }, [loading]);

  return (
    <Card title={<Trans>Offers</Trans>}>
      {tradeRecords?.length ? (
        <TableControlled
          rows={tradeRecords}
          cols={cols}
        />
      ) : (
        <Typography variant="body2">
          <Trans>No current offers</Trans>
        </Typography>
      )}
    </Card>
  );
}

export function OfferManager() {
  const { data, isLoading } = useGetAllOffersQuery();
  const history = useHistory();

  function handleCreateOffer() {
    history.push('/dashboard/wallets/offers/create');
  }

  function handleImportOffer() {
    history.push('/dashboard/wallets/offers/import');
  }

  console.log('isLoading: ', isLoading);
  if (!isLoading) {
    console.log("offers: ");
    console.log(data);
  }

  return (
    <Flex flexDirection="column" gap={3}>
      <Flex flexGrow={1}>
        <Back variant="h5" to="/dashboard/wallets">
          <Trans>Manage Offers</Trans>
        </Back>
      </Flex>
      <Grid container>
        <Grid xs={12} md={6} lg={5} item>
          <CardHero>
            <StyledTradeIcon color="primary" />
            <Typography variant="body1">
              <Trans>
                Create an offer to exchange XCH or other tokens. View an offer to inspect and accept an offer made by another party.
              </Trans>
            </Typography>
            <Button onClick={handleCreateOffer} variant="contained" color="primary">
              <Trans>Create an Offer</Trans>
            </Button>
            <Button onClick={handleImportOffer} variant="contained" color="primary">
              <Trans>View an Offer</Trans>
            </Button>
          </CardHero>
        </Grid>
      </Grid>
      <Divider />
      <OfferList />
    </Flex>
  );
}

export function CreateOffer() {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route path={`${path}/create`}>
        <CreateOfferEditor />
      </Route>
      <Route path={`${path}/import`}>
        <OfferImport />
      </Route>
      <Route path={`${path}/manage`}>
        <OfferManager />
      </Route>
    </Switch>
  );
}