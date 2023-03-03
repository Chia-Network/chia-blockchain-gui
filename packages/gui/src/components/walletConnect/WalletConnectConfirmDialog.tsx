import { useGetKeysQuery } from '@chia-network/api-react';
import { ConfirmDialog, Flex, LoadingOverlay } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Divider, Switch } from '@mui/material';
import React, { type ReactNode, useState, useMemo } from 'react';

import type WalletConnectCommandParam from '../../@types/WalletConnectCommandParam';
import useWalletConnectPairs from '../../hooks/useWalletConnectPairs';
import WalletConnectMetadata from './WalletConnectMetadata';

export type WalletConnectConfirmDialogProps = {
  topic: string;
  command: string;
  message: ReactNode;
  fingerprint: number;
  isDifferentFingerprint: boolean;
  bypassConfirm?: boolean;
  params: WalletConnectCommandParam[];
  values: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
  onClose?: (confirmed?: boolean) => void;
  open?: boolean;
};

export default function WalletConnectConfirmDialog(props: WalletConnectConfirmDialogProps) {
  const {
    topic,
    command,
    message,
    fingerprint,
    isDifferentFingerprint,
    bypassConfirm = false,
    onClose = () => {},
    open = false,
    params,
    values: defaultValues,
    onChange,
  } = props;

  const [values, setValues] = useState(defaultValues);
  const { getPairBySession, bypassCommand } = useWalletConnectPairs();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery();
  const key = keys?.find((item) => item.fingerprint === fingerprint);

  const [rememberChoice, setRememberChoice] = useState(false);

  const pair = useMemo(() => getPairBySession(topic), [topic, getPairBySession]);

  function handleRememberChoiceChanged(_: any, checked: boolean) {
    setRememberChoice(checked);
  }

  function handleClose(confirmed: boolean) {
    if (rememberChoice) {
      bypassCommand(topic, command, confirmed);
    }

    onClose?.(confirmed);
  }

  function handleChangeValues(newValues: Record<string, any>) {
    setValues(newValues);
    onChange?.(newValues);
  }

  return (
    <ConfirmDialog
      title={<Trans>Confirmation Request</Trans>}
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

          {bypassConfirm && (
            <>
              <Divider />
              <Flex justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="warning">
                  Remember my choice for this command
                </Typography>
                <Switch onChange={handleRememberChoiceChanged} checked={rememberChoice} />
              </Flex>
            </>
          )}
        </Flex>
      </LoadingOverlay>
    </ConfirmDialog>
  );
}
