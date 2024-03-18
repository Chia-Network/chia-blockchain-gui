import { useGetKeysQuery } from '@chia-network/api-react';
import { ConfirmDialog, Flex, LoadingOverlay } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Divider } from '@mui/material';
import React, { type ReactNode, useState, useMemo } from 'react';

import type WalletConnectCommandParam from '../../@types/WalletConnectCommandParam';
import useWalletConnectPairs from '../../hooks/useWalletConnectPairs';

import WalletConnectMetadata from './WalletConnectMetadata';

export type WalletConnectRequestPermissionsConfirmDialogProps = {
  topic: string;
  message: ReactNode;
  fingerprint: number;
  isDifferentFingerprint: boolean;
  params: WalletConnectCommandParam[];
  values: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
  onClose?: (confirmed?: boolean) => void;
  open?: boolean;
};

export default function WalletConnectRequestPermissionsConfirmDialog(
  props: WalletConnectRequestPermissionsConfirmDialogProps
) {
  const {
    topic,
    message,
    fingerprint,
    isDifferentFingerprint,
    onClose = () => {},
    open = false,
    params,
    values: defaultValues,
    onChange,
  } = props;

  const [values, setValues] = useState(defaultValues);
  const { getPairBySession } = useWalletConnectPairs();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery();
  const key = keys?.find((item) => item.fingerprint === fingerprint);

  const pair = useMemo(() => getPairBySession(topic), [topic, getPairBySession]);

  function handleClose(confirmed: boolean) {
    onClose?.(confirmed);
  }

  function handleChangeValues(newValues: Record<string, any>) {
    setValues(newValues);
    onChange?.(newValues);
  }

  return (
    <ConfirmDialog
      title={<Trans>Requesting Permissions</Trans>}
      confirmColor="primary"
      confirmTitle={<Trans>Confirm</Trans>}
      cancelTitle={<Trans>Reject</Trans>}
      onClose={handleClose}
      open={open}
    >
      <LoadingOverlay isLoading={isLoadingPublicKeys}>
        <Flex flexDirection="column" gap={2}>
          <Typography variant="body1">{message}</Typography>

          {params.length > 0 && (
            <Flex flexDirection="column" gap={2}>
              {params.map(({ label, name, hide, displayComponent }) => {
                if (hide || !(name in values)) {
                  return null;
                }

                const value = values[name];
                return (
                  <Flex flexDirection="column" key={name}>
                    <Typography color="textPrimary">{label ?? name}</Typography>
                    <Typography color="textSecondary">
                      {displayComponent
                        ? displayComponent(value, params, values, handleChangeValues)
                        : value?.toString() ?? <Trans>Not Available</Trans>}
                    </Typography>
                  </Flex>
                );
              })}
            </Flex>
          )}

          <Divider />
          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1" color="textPrimary">
              <Trans>Key</Trans>
            </Typography>
            {!!key && (
              <Typography variant="body1" color={isDifferentFingerprint ? 'warning' : 'textSecondary'}>
                {key.label ?? <Trans>Wallet</Trans>}
              </Typography>
            )}

            <Typography variant="body2" color={isDifferentFingerprint ? 'warning' : 'textSecondary'}>
              {fingerprint}
            </Typography>
          </Flex>

          <Divider />

          <Flex flexDirection="column" gap={1}>
            <Typography variant="body1" color="textPrimary">
              <Trans>Application</Trans>
            </Typography>
            {pair && <WalletConnectMetadata metadata={pair.metadata} />}
          </Flex>
        </Flex>
      </LoadingOverlay>
    </ConfirmDialog>
  );
}
