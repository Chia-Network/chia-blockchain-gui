import { AlertDialog } from '@chia/core';
import { Trans } from '@lingui/macro';
import React from 'react';
import { useDispatch } from 'react-redux';

import PlotNFTState from '../constants/PlotNFTState';
import { pwJoinPool } from '../modules/plotNFT';
import type PlotNFT from '../types/PlotNFT';
import useAbsorbRewards from './useAbsorbRewards';
import useOpenDialog from './useOpenDialog';
import usePlotNFTDetails from './usePlotNFTDetails';

export default function usePoolJoin(nft: PlotNFT) {
  const dispatch = useDispatch();
  const openDialog = useOpenDialog();
  const absorbRewards = useAbsorbRewards(nft);
  const { isPending, isSynced, walletId, balance, state } =
    usePlotNFTDetails(nft);

  async function handleJoin(
    poolUrl: string,
    relativeLockHeight: number,
    targetPuzzlehash?: string,
    fee?: number,
  ) {
    if (!isSynced) {
      await openDialog(
        <AlertDialog>
          <Trans>Please wait for wallet synchronization</Trans>
        </AlertDialog>,
      );
      return;
    }
    if (isPending) {
      await openDialog(
        <AlertDialog>
          <Trans>You are in pending state. Please wait for confirmation</Trans>
        </AlertDialog>,
      );
      return;
    }

    if (balance && state === PlotNFTState.SELF_POOLING) {
      await absorbRewards(walletId);
    }

    await dispatch(
      pwJoinPool(walletId, poolUrl, relativeLockHeight, targetPuzzlehash, fee),
    );
  }

  return handleJoin;
}
