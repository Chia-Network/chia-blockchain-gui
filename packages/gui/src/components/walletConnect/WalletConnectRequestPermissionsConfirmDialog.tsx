import { useGetKeysQuery } from '@chia-network/api-react';
import { ConfirmDialog, Flex, LoadingOverlay } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Alert, Typography, Divider } from '@mui/material';
import React from 'react';

import type WalletConnectCommandParam from '../../@types/WalletConnectCommandParam';
import walletConnectCommands from '../../constants/WalletConnectCommands';
import useWalletConnectPairs from '../../hooks/useWalletConnectPairs';

import WalletConnectMetadata from './WalletConnectMetadata';

export type WalletConnectRequestPermissionsConfirmDialogProps = {
  topic: string;
  fingerprint: number;
  isDifferentFingerprint: boolean;
  params: WalletConnectCommandParam[];
  values: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
  onClose?: (confirmed?: boolean) => void;
  open?: boolean;
};

export default function WalletConnectRequestPermissionsConfirmDialog(
  props: WalletConnectRequestPermissionsConfirmDialogProps,
) {
  const {
    topic,
    fingerprint,
    isDifferentFingerprint,
    onClose = () => {},
    open = false,
    params,
    values: defaultValues,
    onChange,
  } = props;

  const [values, setValues] = React.useState(defaultValues);
  const { getPairBySession, bypassCommands } = useWalletConnectPairs();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery({});
  const key = keys?.find((item) => item.fingerprint === fingerprint);

  const pair = React.useMemo(() => getPairBySession(topic), [topic, getPairBySession]);

  const targetCommands = React.useMemo(() => {
    for (let i = 0; i < params.length; i++) {
      const p = params[i];
      if (p.name === 'commands') {
        return (values.commands as string[]).map((cmd) => {
          const cmdDescription = walletConnectCommands.find((item) => `chia_${item.command}` === cmd);
          return {
            command: cmdDescription?.command ?? cmd.replace('chia_', ''),
            bypassConfirm: Boolean(cmdDescription?.bypassConfirm),
          };
        });
      }
    }
    return [];
  }, [params, values]);

  const disableApprove = React.useMemo(() => targetCommands.some((cmd) => !cmd.bypassConfirm), [targetCommands]);

  const handleClose = React.useCallback(
    (confirmed: boolean) => {
      if (confirmed) {
        // filter out commands that don't allow bypassing confirmation
        const bypassingCommands = targetCommands.filter((cmd) => cmd.bypassConfirm).map((cmd) => cmd.command);
        bypassCommands(topic, bypassingCommands, true);
      }

      onClose?.(confirmed);
    },
    [onClose, topic, bypassCommands, targetCommands],
  );

  const handleChangeValues = React.useCallback(
    (newValues: Record<string, any>) => {
      setValues(newValues);
      onChange?.(newValues);
    },
    [setValues, onChange],
  );

  return (
    <ConfirmDialog
      title={<Trans>Requesting Permissions</Trans>}
      confirmColor="primary"
      confirmTitle={<Trans>Approve</Trans>}
      cancelTitle={<Trans>Reject</Trans>}
      onClose={handleClose}
      open={open}
      disableConfirmButton={disableApprove}
    >
      <LoadingOverlay isLoading={isLoadingPublicKeys}>
        <Flex flexDirection="column" gap={2}>
          <Typography variant="body1">
            <Trans>An app has requested permission to execute the following commands.</Trans>
          </Typography>
          <Typography variant="body1">
            <Trans>
              After you approve, the connected app can execute these commands on your behalf without confirmation.
            </Trans>
          </Typography>

          {disableApprove && (
            <Alert severity="warning">
              <Trans>The following commands are not allowed to bypass confirmation.</Trans>
              <Typography color="textSecondary">
                {targetCommands
                  .filter((cmd) => !cmd.bypassConfirm)
                  .map((cmd) => cmd.command)
                  .join(', ')}
              </Typography>
            </Alert>
          )}

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
                        : (value?.toString() ?? <Trans>Not Available</Trans>)}
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
