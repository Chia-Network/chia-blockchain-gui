import { usePrefs } from '@chia-network/api-react';
import { AlertDialog, ButtonLoading, Flex, Form, TextField, useOpenDialog } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';
import { useForm } from 'react-hook-form';

import useCache from '../../hooks/useCache';

type FormData = {
  maxCacheSize: number;
};

export default function LimitCacheSize() {
  const openDialog = useOpenDialog();
  const { setMaxTotalSize } = useCache();

  const [maxCacheSize, setCacheLimitSize] = usePrefs(`cacheLimitSize`, 0);

  const methods = useForm<FormData>({
    defaultValues: {
      maxCacheSize,
    },
  });

  const { isSubmitting } = methods.formState;
  const isLoading = isSubmitting;
  const canSubmit = !isLoading;

  async function handleSubmit(values: FormData) {
    if (isSubmitting) {
      return;
    }

    const newValue = Number(values.maxCacheSize);

    // todo move it ti electron/main
    setCacheLimitSize(newValue);
    await setMaxTotalSize(newValue);

    await openDialog(
      <AlertDialog>
        <Trans>Successfully updated cache size limit.</Trans>
      </AlertDialog>
    );
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit} noValidate>
      <Flex gap={2} row>
        <TextField
          label="MiB"
          name="maxCacheSize"
          type="number"
          disabled={!canSubmit}
          size="small"
          InputProps={{
            inputProps: {
              min: 0,
            },
          }}
        />
        <ButtonLoading
          size="small"
          disabled={!canSubmit}
          type="submit"
          loading={!canSubmit}
          variant="outlined"
          color="secondary"
        >
          <Trans>Update</Trans>
        </ButtonLoading>
      </Flex>
    </Form>
  );
}
