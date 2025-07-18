import { useCallback } from 'react';

export type SaveFileParams = {
  suggestedFilename?: string;
  fileContent: string | DataView;
};

export default function useSaveFile() {
  const saveOfferFile = useCallback(async (params: SaveFileParams) => {
    const { suggestedFilename, fileContent } = params;

    await window.appAPI.showSaveDialogAndSave({
      defaultPath: suggestedFilename,
      content: fileContent,
    });
  }, []);

  return saveOfferFile;
}
