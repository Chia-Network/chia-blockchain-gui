import type { KeyData } from '@chia-network/api';
import { useDeleteLabelMutation, useSetLabelMutation } from '@chia-network/api-react';
import { Trans } from '@lingui/macro';
import { ButtonGroup, Chip, InputAdornment } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

import ButtonLoading from '../../components/ButtonLoading';
import Flex from '../../components/Flex';
import Form from '../../components/Form';
import TextField from '../../components/TextField';
import Tooltip from '../../components/Tooltip';

export type SelectKeyRenameFormProps = {
  keyData: KeyData;
  onClose?: () => void;
};

type FormData = {
  label: string;
};

export default function SelectKeyRenameForm(props: SelectKeyRenameFormProps) {
  const { keyData, onClose } = props;
  const [deleteLabel] = useDeleteLabelMutation();
  const [setLabel] = useSetLabelMutation();
  const methods = useForm<FormData>({
    defaultValues: {
      label: keyData.label || '',
    },
  });

  const { fingerprint } = keyData;
  const { isSubmitting } = methods.formState;

  async function handleSubmit(values: FormData) {
    if (isSubmitting) {
      return;
    }

    const { label } = values;
    const newLabel = label.trim();

    if (keyData.label === newLabel) {
      onClose?.();
      return;
    }

    if (newLabel) {
      await setLabel({
        fingerprint,
        label: newLabel,
      }).unwrap();
    } else {
      await deleteLabel({
        fingerprint,
      }).unwrap();
    }

    onClose?.();
  }

  function handleCancel() {
    onClose?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }

  const canSubmit = !isSubmitting;

  return (
    <Form methods={methods} onSubmit={handleSubmit} sx={{ flexGrow: 1 }} noValidate>
      <Flex gap={1}>
        <TextField
          name="label"
          size="small"
          disabled={!canSubmit}
          data-testid="SelectKeyRenameForm-label"
          onKeyDown={handleKeyDown}
          inputProps={{
            maxLength: 64,
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={<Trans>Cancel</Trans>}>
                  <Chip size="small" aria-label="cancel" label={<Trans>Esc</Trans>} onClick={handleCancel} />
                </Tooltip>
              </InputAdornment>
            ),
          }}
          autoFocus
          fullWidth
        />
        <ButtonGroup>
          <ButtonLoading
            size="small"
            disabled={!canSubmit}
            type="submit"
            loading={!canSubmit}
            variant="outlined"
            color="secondary"
            data-testid="SelectKeyRenameForm-save"
          >
            <Trans>Save</Trans>
          </ButtonLoading>
        </ButtonGroup>
      </Flex>
    </Form>
  );
}
