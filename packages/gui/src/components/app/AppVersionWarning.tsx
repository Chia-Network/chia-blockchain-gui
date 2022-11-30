import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { Trans } from '@lingui/macro';
import {
  Button,
  Flex,
} from '@chia/core';

export interface DialogProps {
  open: boolean;
  onClose: (value: string) => void;
  backV: string;
  guiV: string;
}

export interface WarningProps {
  backV: string;
  guiV: string;
  setVersionDialog: (value: boolean) => void;
}

function WarningDialog(props: DialogProps) {
  const { onClose, open, backV, guiV } = props;

  function handleClose() {
    onClose();
  };

  return (
    <div>
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        fullWidth={true}
        maxWidth = {'xs'}
      >
        <DialogTitle id="alert-dialog-title">
          <Trans>Warning: Mismatched Versions</Trans>
        </DialogTitle>
        <DialogContent>
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body2" color="textSecondary">
              <Trans>
              The backend and the GUI are using two different versions.
              <br />
              <br />
              Backend version: {backV}
              <br />
              GUI version: {guiV}
              <br />
              <br />
              Due to this, the GUI may not behave properly.
              </Trans>
            </Typography>
          </Flex>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="secondary"
            variant="contained"
            style={{ marginBottom: '8px', marginRight: '8px' }}
          >
            <Trans>Close</Trans>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default function AppVersionWarning(props: WarningProps) {
  const { backV, guiV, setVersionDialog } = props;
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    setVersionDialog(false);
  };

  return (
    <div>
      <WarningDialog
        open={open}
        onClose={handleClose}
        backV={backV}
        guiV={guiV}
      />
    </div>
  );
}
