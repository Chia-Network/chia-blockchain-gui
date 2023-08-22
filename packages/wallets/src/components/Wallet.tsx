import { WalletType } from '@chia-network/api';
import { Suspender } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Alert } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';

import useWallet from '../hooks/useWallet';
import WalletCAT from './cat/WalletCAT';
import WalletStandard from './standard/WalletStandard';

export default function Wallet() {
  const { walletId } = useParams();
  const { wallet, loading } = useWallet(walletId);
  if (loading) {
    return <Suspender />;
  }

  if (!wallet) {
    return (
      <Alert severity="warning">
        <Trans>Wallet {walletId} not found</Trans>
      </Alert>
    );
  }

  if (wallet.type === WalletType.STANDARD_WALLET) {
    return <WalletStandard walletId={Number(walletId)} />;
  }

  if ([WalletType.CAT, WalletType.CRCAT].includes(wallet.type)) {
    return <WalletCAT walletId={Number(walletId)} />;
  }

  return (
    <Alert severity="warning">
      <Trans>Wallet with type {wallet.type} not supported</Trans>
    </Alert>
  );
}
