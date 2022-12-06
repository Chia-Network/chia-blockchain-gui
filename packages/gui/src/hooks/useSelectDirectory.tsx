import { AlertDialog, useOpenDialog } from '@chia-network/core';
import { dialog } from '@electron/remote';
import { Trans } from '@lingui/macro';
import isElectron from 'is-electron';
import React from 'react';

type Options = {
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
      const filePath = result.filePaths[0];

      return filePath;
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
