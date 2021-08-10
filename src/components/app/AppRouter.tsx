import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Trans } from '@lingui/macro';
import { PrivateRoute } from '@chia/core';
import SelectKey from '../selectKey/SelectKey';
import WalletAdd from '../wallet/WalletAdd';
import WalletImport from '../wallet/WalletImport';
import Dashboard from '../dashboard/Dashboard';
import BackupRestore from '../backup/BackupRestore';
import type { RootState } from '../../modules/rootReducer';
import LayoutLoading from '../layout/LayoutLoading';
import AppKeyringMigrator from './AppKeyringMigrator';
import AppPassLogin from './AppPassLogin';

export default function AppRouter() {
  const loggedInReceived = useSelector(
    (state: RootState) => state.wallet_state.logged_in_received,
  );
  const walletConnected = useSelector(
    (state: RootState) => state.daemon_state.wallet_connected,
  );

  let keyringNeedsMigration = useSelector(
    (state: RootState) => state.daemon_state.keyring_needs_migration
  );

  let keyringLocked = useSelector(
    (state: RootState) => state.daemon_state.keyring_locked,
  );

  const exiting = useSelector((state: RootState) => state.daemon_state.exiting);

  if (exiting) {
    return (
      <LayoutLoading>
        <Trans>Closing down node and server</Trans>
      </LayoutLoading>
    );
  }
  if (keyringNeedsMigration) {
    return (
      <AppKeyringMigrator />
    )
  }
  if (keyringLocked) {
    return (
      <LayoutLoading>
        <AppPassLogin />
      </LayoutLoading>
    );
  }
  if (!walletConnected) {
    return (
      <LayoutLoading>
        <Trans>Connecting to wallet</Trans>
      </LayoutLoading>
    );
  }
  if (!loggedInReceived) {
    return (
      <LayoutLoading>
        <Trans>Logging in</Trans>
      </LayoutLoading>
    );
  }

  return (
    <Switch>
      <Route path="/" exact>
        <SelectKey />
      </Route>
      <Route path="/wallet/add" exact>
        <WalletAdd />
      </Route>
      <Route path="/wallet/import" exact>
        <WalletImport />
      </Route>
      <Route path="/wallet/restore" exact>
        <BackupRestore />
      </Route>
      <PrivateRoute path="/dashboard">
        <Dashboard />
      </PrivateRoute>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
