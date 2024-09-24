import { useGetKeysQuery } from '@chia-network/api-react';
import { AlertDialog, ConfirmDialog, Flex, LoadingOverlay } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Typography, Divider, Switch } from '@mui/material';
import { styled } from '@mui/styles';
import React, { type ReactNode, useState, useMemo, useCallback } from 'react';
import StackTrace, { type StackFrame } from 'stacktrace-js';

import type WalletConnectCommandParam from '../../@types/WalletConnectCommandParam';
import useWalletConnectPairs from '../../hooks/useWalletConnectPairs';

import WalletConnectMetadata from './WalletConnectMetadata';

const StyledPre = styled(Typography)(() => ({
  whiteSpace: 'pre-wrap',
}));

function formatStackTrace(stack: StackFrame[]) {
  const stackTrace = stack.map(
    ({ fileName, columnNumber, lineNumber, functionName }) =>
      `at ${fileName}:${lineNumber}:${columnNumber} ${functionName}`,
  );
  return stackTrace.join('\n');
}

type LocalErrorBoundaryProps = React.PropsWithChildren<{
  fallback?: ReactNode;
  onError: (error: Error, stacktrace: string) => void;
}>;
type LocalErrorBoundaryState = { error: false | Error };
class LocalErrorBoundary extends React.Component<LocalErrorBoundaryProps, LocalErrorBoundaryState> {
  constructor(props: LocalErrorBoundaryProps) {
    super(props);
    this.state = { error: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  async componentDidCatch(error: Error) {
    this.props.onError(error, formatStackTrace(await StackTrace.fromError(error)));
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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
  const [error, setError] = useState<{ e: Error; stacktrace: string } | false>(false);
  const { getPairBySession, bypassCommand } = useWalletConnectPairs();
  const { data: keys, isLoading: isLoadingPublicKeys } = useGetKeysQuery();
  const key = keys?.find((item) => item.fingerprint === fingerprint);

  const [rememberChoice, setRememberChoice] = useState(false);

  const pair = useMemo(() => getPairBySession(topic), [topic, getPairBySession]);

  const handleRememberChoiceChanged = useCallback((_: any, checked: boolean) => {
    setRememberChoice(checked);
  }, []);

  const onCloseConfirmDialog = useCallback(
    (confirmed: boolean) => {
      if (rememberChoice) {
        bypassCommand(topic, command, confirmed);
      }

      onClose?.(confirmed);
    },
    [rememberChoice, bypassCommand, onClose, topic, command],
  );

  const onCloseAlertDialog = useCallback(() => {
    setError(false);
    onClose?.(false);
  }, [onClose]);

  const handleChangeValues = useCallback(
    (newValues: Record<string, any>) => {
      setValues(newValues);
      onChange?.(newValues);
    },
    [onChange],
  );

  const onError = useCallback((err: Error, stacktrace: string) => {
    setError({ e: err, stacktrace });
  }, []);

  const paramRows = useMemo(() => {
    if (params.length === 0) {
      return null;
    }
    return (
      <Flex flexDirection="column" gap={2}>
        {params.map(({ label, name, hide, displayComponent }) => {
          if (hide || !(name in values)) {
            return null;
          }

          const value = values[name];
          return (
            <LocalErrorBoundary onError={onError}>
              <Flex flexDirection="column" key={name}>
                <Typography color="textPrimary">{label ?? name}</Typography>
                <Typography color="textSecondary">
                  {displayComponent
                    ? displayComponent(value, params, values, handleChangeValues)
                    : (value?.toString() ?? <Trans>Not Available</Trans>)}
                </Typography>
              </Flex>
            </LocalErrorBoundary>
          );
        })}
      </Flex>
    );
  }, [params, values, handleChangeValues, onError]);

  if (error) {
    return (
      <AlertDialog title={<Trans>Invalid WalletConnect data</Trans>} onClose={onCloseAlertDialog} open={open}>
        <Flex flexDirection="column" gap={2}>
          <Flex flexDirection="column">
            <Typography variant="h6">
              <Trans>Error:</Trans> {error.e.message}
            </Typography>
            <StyledPre variant="body2">{error.stacktrace}</StyledPre>
          </Flex>
        </Flex>
      </AlertDialog>
    );
  }

  return (
    <ConfirmDialog
      title={<Trans>Confirmation Request</Trans>}
      confirmColor="primary"
      confirmTitle={<Trans>Confirm</Trans>}
      cancelTitle={<Trans>Reject</Trans>}
      onClose={onCloseConfirmDialog}
      open={open}
    >
      <LoadingOverlay isLoading={isLoadingPublicKeys}>
        <Flex flexDirection="column" gap={2}>
          <Typography variant="body1">{message}</Typography>

          {paramRows}

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
