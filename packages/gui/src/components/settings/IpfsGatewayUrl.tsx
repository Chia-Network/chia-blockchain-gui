import { ButtonLoading, Flex, Form, TextField } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import useIpfsGatewayUrl from '../../hooks/useIpfsGatewayUrl';
import { DEFAULT_IPFS_GATEWAY_BASE, normalizeIpfsGatewayBase } from '../../util/ipfs';

type FormData = {
  gatewayUrl: string;
};

export type IpfsGatewayUrlProps = {
  disabled?: boolean;
};

// Lets the user point ipfs:// fetching at a gateway other than the public
// default — the public gateways sit behind bot management that intermittently
// refuses non-browser clients, and IPFS users often run a local node. The
// value is saved normalized so the main process, which re-normalizes the
// persisted copy, and this field always show the same gateway.
export default function IpfsGatewayUrl(props: IpfsGatewayUrlProps) {
  const { disabled = false } = props;
  const [gatewayUrl, setGatewayUrl] = useIpfsGatewayUrl();

  const methods = useForm<FormData>({
    defaultValues: {
      gatewayUrl: gatewayUrl ?? '',
    },
  });

  const { reset, setError } = methods;

  useEffect(() => {
    reset({
      gatewayUrl: gatewayUrl ?? '',
    });
  }, [gatewayUrl, reset]);

  const { isSubmitting } = methods.formState;
  const canSubmit = !disabled && !isSubmitting;
  const isDefault = !gatewayUrl;

  function handleSubmit(values: FormData) {
    const input = values.gatewayUrl.trim();
    if (!input) {
      setGatewayUrl(undefined);
      return;
    }

    const normalized = normalizeIpfsGatewayBase(input);
    if (!normalized) {
      setError('gatewayUrl', {
        type: 'validate',
        message: t`Enter an https:// gateway address, for example https://dweb.link`,
      });
      return;
    }

    setGatewayUrl(normalized === DEFAULT_IPFS_GATEWAY_BASE ? undefined : normalized);
  }

  function handleReset() {
    setGatewayUrl(undefined);
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit} noValidate>
      <Flex gap={2} row alignItems="flex-start">
        <TextField
          name="gatewayUrl"
          type="url"
          placeholder={DEFAULT_IPFS_GATEWAY_BASE}
          disabled={!canSubmit}
          size="small"
          fullWidth
          inputProps={{
            spellCheck: false,
            autoCapitalize: 'off',
            autoCorrect: 'off',
          }}
        />
        <ButtonLoading
          size="small"
          disabled={!canSubmit}
          type="submit"
          loading={isSubmitting}
          variant="outlined"
          color="secondary"
        >
          <Trans>Update</Trans>
        </ButtonLoading>
        {!isDefault && (
          <Button size="small" disabled={!canSubmit} variant="text" color="secondary" onClick={handleReset}>
            <Trans>Reset</Trans>
          </Button>
        )}
      </Flex>
    </Form>
  );
}
