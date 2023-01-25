import { useOpenFullNodeConnectionMutation } from '@chia-network/api-react';
import { Button, ButtonLoading, DialogActions, Flex, Form, TextField, useShowError } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Alert, Dialog, DialogTitle, DialogContent } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

type Props = {
  open: boolean;
  onClose: (value?: any) => void;
};

type FormData = {
  host: string;
  port: string;
};

export default function FullNodeAddConnection(props: Props) {
  const { onClose, open } = props;
  const [openConnection] = useOpenFullNodeConnectionMutation();
  const [error, setError] = React.useState<Error | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const showError = useShowError();

  const methods = useForm<FormData>({
    defaultValues: {
      host: '',
      port: '',
    },
  });

  function handleClose() {
    if (onClose) {
      onClose(true);
    }
  }

  async function handleSubmit(values: FormData) {
    const { host, port } = values;

    setLoading(true);
    setError(undefined);

    try {
      await openConnection({
        host,
        port: Number.parseInt(port, 10),
      }).unwrap();

      handleClose();
    } catch (e: any) {
      console.error(e);
      let updatedError = e;
      if (e.message.startsWith('could not connect to')) {
        updatedError = new Error(t`Could not connect to host ${host} on port ${port}`);
      }

      setError(updatedError);
      showError(updatedError);
    } finally {
      setLoading(false);
    }
  }

  function handleHide() {
    if (onClose) {
      onClose();
    }
  }

  return (
    <Dialog
      onClose={handleHide}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      open={open}
      maxWidth="xs"
      fullWidth
    >
      <Form methods={methods} onSubmit={handleSubmit}>
        <DialogTitle id="alert-dialog-title">
          <Trans>Connect to other peers</Trans>
        </DialogTitle>
        <DialogContent>
          <Flex gap={2} flexDirection="column">
            {error && <Alert severity="error">{error.message}</Alert>}

            <TextField
              label={<Trans>IP address / host</Trans>}
              name="host"
              variant="filled"
              disabled={loading}
              autoFocus
            />
            <TextField label={<Trans>Port</Trans>} name="port" type="number" variant="filled" disabled={loading} />
          </Flex>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHide} variant="outlined" color="secondary">
            <Trans>Cancel</Trans>
          </Button>
          <ButtonLoading loading={loading} variant="contained" color="primary" type="submit">
            <Trans>Connect</Trans>
          </ButtonLoading>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
