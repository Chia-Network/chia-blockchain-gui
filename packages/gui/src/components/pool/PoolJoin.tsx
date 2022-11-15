import { AlertDialog, useOpenDialog } from '@chia/core';
import { Trans } from '@lingui/macro';
import React from 'react';
import { useNavigate } from 'react-router';

import usePlotNFTDetails from '../../hooks/usePlotNFTDetails';
import type PlotNFT from '../../types/PlotNFT';

type Props = {
  nft: PlotNFT;
  children: (data: {
    join: () => Promise<void>;
    disabled: boolean;
  }) => JSX.Element;
};

export default function PoolJoin(props: Props) {
  const {
    children,
    nft,
    nft: {
      poolState: { p2SingletonPuzzleHash },
    },
  } = props;
  const { canEdit, balance, isSelfPooling } = usePlotNFTDetails(nft);
  const navigate = useNavigate();
  const openDialog = useOpenDialog();

  async function handleJoinPool() {
    if (!canEdit) {
      return;
    }

    if (isSelfPooling && balance) {
      await openDialog(
        <AlertDialog>
          <Trans>You need to claim your rewards first</Trans>
        </AlertDialog>,
      );
      return;
    }

    navigate(`/dashboard/pool/${p2SingletonPuzzleHash}/change-pool`);
  }

  return children({
    join: handleJoinPool,
    disabled: !canEdit,
  });
}
