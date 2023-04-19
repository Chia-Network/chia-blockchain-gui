import { AlertDialog, useOpenDialog } from '@chia-network/core';
import { dialog } from '@electron/remote';
import { Trans } from '@lingui/macro';
import isElectron from 'is-electron';
import React from 'react';

type Options = {
  properties?: string[];
  defaultPath?: string;
  buttonLabel?: string;
};

export default function useSelectDirectory(
  defaultOptions?: Options
): (options?: Options) => Promise<string | undefined> {
  const openDialog = useOpenDialog();

  async function handleSelect(options?: Options): Promise<string | undefined> {
    if (isElectron()) {
      // @ts-ignore
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'showHiddenFiles'],
        ...defaultOptions,
        ...options,
      });

      if (result.canceled) {
        return undefined;
      }

      return result.filePaths[0];
    }

    openDialog(
      <AlertDialog>
        <Trans>This feature is available only from the GUI.</Trans>
      </AlertDialog>
    );
    return undefined;
  }

  return handleSelect;
}
