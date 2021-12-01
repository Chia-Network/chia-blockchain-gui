import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Trans } from '@lingui/macro';
import moment from 'moment';
import { Switch, Route, useHistory, useRouteMatch } from 'react-router-dom';
import { Back, Card, CardHero, Flex, More, TableControlled } from '@chia/core';
import { Box, Button, Divider, Grid, ListItemIcon, MenuItem, Typography } from '@material-ui/core';
import { Cancel, GetApp as Download } from '@material-ui/icons';
import { Trade as TradeIcon } from '@chia/icons';
import { useGetAllOffersQuery, useGetOfferDataMutation } from '@chia/api-react';
import { CreateOfferEditorView } from './OfferEditor';
import { OfferImportView } from './OfferImport';
import fs from 'fs';

const StyledTradeIcon = styled(TradeIcon)`
  font-size: 4rem;
`;

function cancelOffer(tradeId: string) {
  console.log("cancelOffer: ", tradeId);
}

function OfferListView() {
  const { data, loading, error } = useGetAllOffersQuery();
  const [getOfferData] = useGetOfferDataMutation();

  async function exportOffer(tradeId: string) {
    const { data: response } = await getOfferData(tradeId);
    const { offer: offerData, success } = response;
    if (success === true) {
      const dialogOptions = {
        defaultPath: `offer-${tradeId}.offer`,
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

  const tradeRecords: any[] = useMemo(() => {
    if (loading || !data) {
      return [];
    }
    return data.tradeRecords;
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
          let offers: string[] = []
          let requests: string[] = []

          for (const [assetId, amount] of Object.entries(row.summary.offered)) {
            offers.push(`${amount} ${assetId}`)
          }
          for (const [assetId, amount] of Object.entries(row.summary.requested)) {
            requests.push(`${amount} ${assetId}`)
          }

          const summary = `${offers.join(', ')} --> ${requests.join(', ')}`;

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
                      exportOffer(tradeId);
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
                      cancelOffer(tradeId);
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

export function OfferManagerView() {
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
      <OfferListView />
    </Flex>
  );
}

export function CreateOfferView() {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route path={`${path}/create`}>
        <CreateOfferEditorView />
      </Route>
      <Route path={`${path}/import`}>
        <OfferImportView />
      </Route>
      <Route path={`${path}/manage`}>
        <OfferManagerView />
      </Route>
    </Switch>
  );
}