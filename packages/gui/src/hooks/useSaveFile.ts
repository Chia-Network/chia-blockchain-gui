import fs from 'fs';

import { useShowSaveDialog } from '@chia-network/core';
import { useCallback } from 'react';

export type SaveFileParams = {
  suggestedFilename?: string;
  fileContent: string | DataView;
};

export default function useSaveFile() {
  const showSaveDialog = useShowSaveDialog();

  const saveOfferFile = useCallback(
    (params: SaveFileParams) => {
      async function saveFile(): Promise<void> {
        const { suggestedFilename, fileContent } = params;
        const dialogOptions = {
          defaultPath: suggestedFilename,
        };
        const result = await showSaveDialog(dialogOptions);
        const { filePath, canceled } = result;

        if (!canceled && filePath) {
          try {
            fs.writeFileSync(filePath, fileContent);
          } catch (err) {
            console.error(err);
            throw err;
          }
        }
      }
      return saveFile();
    },
    [showSaveDialog]
  );

  return saveOfferFile;
}
