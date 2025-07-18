import { AlertDialog, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import isElectron from 'is-electron';
import React from 'react';

export default function useSelectDirectory() {
  const openDialog = useOpenDialog();

  async function handleSelect(options: { defaultPath?: string } = {}): Promise<string | undefined> {
    if (isElectron()) {
      return window.appAPI.showOpenDirectoryDialog(options);
    }

    openDialog(
      <AlertDialog>
        <Trans>This feature is available only from the GUI.</Trans>
      </AlertDialog>,
    );

    return undefined;
  }

  return handleSelect;
}
