import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent, TextField } from '@mui/material';
import React, { ReactNode } from 'react';

import Button from '../Button';
import DialogActions from '../DialogActions';

export type AlertDialogProps = {
  title?: ReactNode;
  open?: boolean;
  onClose?: (value?: any) => void;
  onAdd: (value: string) => void;
  placeholderName?: string;
};

export default function AlertDialog(props: AlertDialogProps) {
  const { onClose = () => {}, open = false, title, onAdd, placeholderName = 'Title' } = props;

  const [newFolder, setNewFolder] = React.useState('');

  const inputWrapper = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setTimeout(() => {
      if (inputWrapper?.current) {
        (inputWrapper?.current.querySelector('input') as HTMLElement).focus();
      }
    }, 100);
  }, [inputWrapper]);

  function handleClose() {
    onClose?.(true);
  }

  function handleHide() {
    onClose?.();
  }

  return (
    <Dialog
      onClose={handleHide}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      open={open}
    >
      {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
      <DialogContent id="alert-dialog-description">
        <TextField
          ref={inputWrapper}
          autoFocus
          onChange={(e) => {
            setNewFolder(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newFolder !== '') {
              onAdd(newFolder);
              handleClose();
            }
          }}
          label={placeholderName}
          variant="filled"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined" color="primary" autoFocus>
          <Trans>Cancel</Trans>
        </Button>
        <Button
          onClick={() => {
            if (newFolder !== '') {
              onAdd(newFolder);
              handleClose();
            }
          }}
          variant="contained"
          color="primary"
          autoFocus
        >
          <Trans>Add</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
