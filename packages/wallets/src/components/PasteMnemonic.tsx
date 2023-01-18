import { Form, TextField } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

type MnemonicPasteFormData = {
  mnemonicList: string;
};

type Props = {
  onSuccess: (mnemonicList: string) => void;
  onCancel: () => void;
  twelveWord: boolean;
};

export default function MnemonicPaste(props: Props) {
  const { onSuccess, onCancel, twelveWord } = props;

  const formMethods = useForm<MnemonicPasteFormData>({
    defaultValues: {
      mnemonicList: '',
    },
  });

  async function handleSubmit({ mnemonicList }: MnemonicPasteFormData) {
    onSuccess(mnemonicList);
  }

  async function handleCancel() {
    onCancel();
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    const keyHandlerMapping: { [key: string]: () => Promise<void> } = {
      Enter: formMethods.handleSubmit(handleSubmit),
      Escape: handleCancel,
    };
    const handler: () => Promise<void> | undefined = keyHandlerMapping[e.key];

    if (handler) {
      // Disable default event handling to avoid navigation updates
      e.preventDefault();
      e.stopPropagation();

      await handler();
    }
  }

  return (
    <Dialog open aria-labelledby="form-dialog-title" fullWidth maxWidth="md" onKeyDown={handleKeyDown}>
      <DialogTitle id="form-dialog-title">
        <Trans>Paste Mnemonic ({twelveWord ? '12' : '24'} words)</Trans>
      </DialogTitle>
      <Form methods={formMethods} onSubmit={formMethods.handleSubmit(handleSubmit)}>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={5}
            color="secondary"
            margin="dense"
            name="mnemonicList"
            variant="filled"
            type="password"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancel}
            color="secondary"
            variant="contained"
            style={{ marginBottom: '8px', marginRight: '8px' }}
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" color="primary" variant="contained" style={{ marginBottom: '8px', marginRight: '8px' }}>
            <Trans>Import</Trans>
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
