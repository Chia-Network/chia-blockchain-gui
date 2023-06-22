import { Trans } from '@lingui/macro';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import React, { ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import Button from '../Button';
import DialogActions from '../DialogActions';
import Form from '../Form';
import TextField from '../TextField';

export type AlertDialogProps = {
  title?: ReactNode;
  open?: boolean;
  onClose?: (value?: any) => void;
  onAdd: (value: string) => void;
  placeholderName?: string;
};

export default function AlertDialog(props: AlertDialogProps) {
  const { onClose = () => {}, open = false, title, onAdd, placeholderName = 'Title' } = props;

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

  type FormData = {
    folderName: string;
  };

  const formMethods = useForm<FormData>({
    defaultValues: {
      folderName: '',
    },
  });

  function handleSubmit(objValue: any) {
    onAdd(objValue.folderName);
    handleClose();
  }

  return (
    <Dialog
      onClose={handleHide}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      open={open}
    >
      <Form methods={formMethods} onSubmit={formMethods.handleSubmit(handleSubmit)}>
        {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
        <DialogContent id="alert-dialog-description">
          <TextField
            type="text"
            ref={inputWrapper}
            autoFocus
            name="folderName"
            label={placeholderName}
            variant="filled"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined" color="primary" autoFocus>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" variant="contained" color="primary" autoFocus>
            <Trans>Add</Trans>
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
