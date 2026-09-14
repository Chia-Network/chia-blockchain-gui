import { Flex, Form, TextField } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { LoadingButton } from '@mui/lab';
import { Button, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type IpfsGatewayProbeResult from '../../@types/IpfsGatewayProbeResult';
import useCache from '../../hooks/useCache';
import useIpfsGatewayHealth from '../../hooks/useIpfsGatewayHealth';
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
  const { probeIpfsGateway } = useCache();
  // what the downloads say about the gateway in use — shown here too, so the
  // field that holds a wrong address is where the problem is reported
  const health = useIpfsGatewayHealth();
  // the answer of the gateway the user last saved, until the next save
  const [probe, setProbe] = useState<IpfsGatewayProbeResult | undefined>(undefined);

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

  // Saves the address, then asks the gateway for a well-known file once. The
  // address is saved either way — an offline user must still be able to set
  // it — but a host that does not answer is said so right here, instead of
  // as the same generic failure on every NFT tile: the shape check below
  // cannot tell a misspelled name from a real one, only the network can.
  async function handleSubmit(values: FormData) {
    const input = values.gatewayUrl.trim();
    setProbe(undefined);
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
    try {
      setProbe(await probeIpfsGateway(normalized));
    } catch {
      // the address passed the shape check above; a probe that cannot even be
      // made leaves the downloads to report on the gateway
    }
  }

  function handleReset() {
    setProbe(undefined);
    setGatewayUrl(undefined);
  }

  // Only a verdict on the address currently configured is shown: the probe of
  // a previous address is dropped on save, and the health hook already limits
  // itself to the configured gateway. The downloads verdict wins over the
  // one-off probe — it is more recent and rests on more requests.
  const configuredGateway = normalizeIpfsGatewayBase(gatewayUrl) ?? DEFAULT_IPFS_GATEWAY_BASE;
  const currentProbe = probe?.gateway === configuredGateway ? probe : undefined;
  const verdict = health ?? currentProbe;
  const isUnreachable = verdict !== undefined && !verdict.reachable;

  return (
    <Form methods={methods} onSubmit={handleSubmit} noValidate>
      <Flex gap={1} flexDirection="column">
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
          <LoadingButton
            size="small"
            disabled={!canSubmit}
            type="submit"
            loading={isSubmitting}
            variant="outlined"
            color="secondary"
          >
            <Trans>Update</Trans>
          </LoadingButton>
          {!isDefault && (
            <Button size="small" disabled={!canSubmit} variant="text" color="secondary" onClick={handleReset}>
              <Trans>Reset</Trans>
            </Button>
          )}
        </Flex>
        {isUnreachable && (
          <Typography variant="body2" color="warning.main">
            <Trans>
              The gateway did not answer ({verdict.error}). The address is saved; check it if NFT previews stay empty.
            </Trans>
          </Typography>
        )}
        {!isUnreachable && currentProbe?.reachable && (
          <Typography variant="body2" color="text.secondary">
            <Trans>The gateway answered (HTTP {currentProbe.status}).</Trans>
          </Typography>
        )}
      </Flex>
    </Form>
  );
}
