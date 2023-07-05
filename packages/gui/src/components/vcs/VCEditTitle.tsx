import { usePrefs } from '@chia-network/api-react';
import { ButtonLoading, Flex, Form, TextField, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { ButtonGroup, Chip, InputAdornment } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

export type VCEditTitleProps = {
  vcId: string;
  onClose?: () => void;
};

type FormData = {
  label: string;
};

export default function VCEditTitle(props: VCEditTitleProps) {
  const { onClose, vcId } = props;
  const [vcTitlesObject, setVcTitlesObject] = usePrefs<any>('verifiable-credentials-titles', {});

  const methods = useForm<FormData>({
    defaultValues: {
      label: vcTitlesObject[vcId] || 'Verifiable Credential',
    },
  });

  const { isSubmitting } = methods.formState;

  async function handleSubmit(values: FormData) {
    if (isSubmitting) {
      return;
    }

    const { label } = values;
    const newLabel = label.trim();

    if (vcTitlesObject[vcId] === newLabel) {
      onClose?.();
      return;
    }

    if (newLabel) {
      setVcTitlesObject({ ...vcTitlesObject, [vcId]: newLabel });
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
    <Form methods={methods} onSubmit={handleSubmit} sx={{ flexGrow: 1, marginBottom: '5px' }} noValidate>
      <Flex gap={1}>
        <TextField
          name="label"
          size="small"
          disabled={!canSubmit}
          onKeyDown={handleKeyDown}
          inputProps={{
            maxLength: 64,
          }}
          sx={{ width: '300px' }}
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
          >
            <Trans>Save</Trans>
          </ButtonLoading>
        </ButtonGroup>
      </Flex>
    </Form>
  );
}
