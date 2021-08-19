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
import AppPassPrompt from './AppPassPrompt';
import PassphrasePromptReason from '../core/constants/PassphrasePromptReason';

export default function AppRouter() {
  const loggedInReceived = useSelector(
    (state: RootState) => state.wallet_state.logged_in_received,
  );
  const walletConnected = useSelector(
    (state: RootState) => state.daemon_state.wallet_connected,
  );

  let keyringNeedsMigration = useSelector(
    (state: RootState) => state.keyring_state.needs_migration
  );

  let keyringMigrationSkipped = useSelector(
    (state: RootState) => state.keyring_state.migration_skipped
  );

  let keyringLocked = useSelector(
    (state: RootState) => state.keyring_state.is_locked,
  );

  const exiting = useSelector((state: RootState) => state.daemon_state.exiting);

  if (exiting) {
    return (
      <LayoutLoading>
        <Trans>Closing down node and server</Trans>
      </LayoutLoading>
    );
  }
  if (keyringNeedsMigration && !keyringMigrationSkipped) {
    return (
      <AppKeyringMigrator />
    );
  }
  if (keyringLocked) {
    return (
      <LayoutLoading>
        <AppPassPrompt reason={PassphrasePromptReason.KEYRING_LOCKED} />
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
