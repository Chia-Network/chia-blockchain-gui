import React from 'react';
import styled from 'styled-components';
import { Trans } from '@lingui/macro';
import { Switch, Route, useHistory, useRouteMatch } from 'react-router-dom';
import { Back, CardHero, Flex } from '@chia/core';
import { Button, Grid, Typography } from '@material-ui/core';
import { Trade as TradeIcon } from '@chia/icons';
import { CreateOfferEditorView } from './OfferEditor';
import { DisplayOfferView } from './OfferImportView';

const StyledTradeIcon = styled(TradeIcon)`
  font-size: 4rem;
`;

export function OfferManagerView() {
  const history = useHistory();

  function handleCreateOffer() {
    history.push('/dashboard/wallets/offers/create');
  }

  function handleImportOffer() {
    history.push('/dashboard/wallets/offers/import');
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
              Create an offer to exchange XCH or other tokens. Import an offer to inspect and accept an offer made by another party.
            </Trans>
          </Typography>
          <Button onClick={handleCreateOffer} variant="contained" color="primary">
            <Trans>Create an Offer</Trans>
          </Button>
          <Button onClick={handleImportOffer} variant="contained" color="primary">
            <Trans>Import an Offer</Trans>
          </Button>
        </CardHero>
      </Grid>
    </Grid>
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
        <DisplayOfferView />
      </Route>
      <Route path={`${path}/manage`}>
        <OfferManagerView />
      </Route>
    </Switch>
  );
}