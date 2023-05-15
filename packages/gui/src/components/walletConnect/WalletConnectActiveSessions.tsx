import { Flex, Loading, TooltipIcon } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import React, { useMemo } from 'react';

import WalletConnectCommands from '../../constants/WalletConnectCommands';
import useWalletConnectContext from '../../hooks/useWalletConnectContext';

const supportedCommands = WalletConnectCommands.map((item) => `chia_${item.command}`);

export type WalletConnectActiveSessionsProps = {
  topic: string;
};

export default function WalletConnectActiveSessions(props: WalletConnectActiveSessionsProps) {
  const { topic } = props;
  const { pairs, isLoading } = useWalletConnectContext();

  const pair = useMemo(() => pairs.getPair(topic), [topic, pairs]);

  return (
    <Flex flexDirection="column" gap={1}>
      <Typography>
        <Trans>Active Sessions</Trans>
      </Typography>
      <Flex flexDirection="column" gap={1}>
        {isLoading ? (
          <Loading center />
        ) : !pair ? (
          <Typography variant="body2" color="textSecondary">
            <Trans>Application doesn't have any active pair.</Trans>
          </Typography>
        ) : !pair.sessions?.length ? (
          <Typography variant="body2" color="textSecondary">
            <Trans>Application has no active sessions</Trans>
          </Typography>
        ) : (
          <Flex flexDirection="column" gap={2}>
            {pair.sessions.map((session) => {
              const { topic: sessionTopic, namespaces = {} } = session;

              const methods = namespaces.chia?.methods ?? [];

              const unsupportedMethods = methods.filter((method) => !supportedCommands.includes(method));

              return (
                <Flex flexDirection="column">
                  <Typography key={sessionTopic} variant="body2" color="textSecondary" noWrap>
                    {sessionTopic}
                  </Typography>

                  {unsupportedMethods.length ? (
                    <Typography variant="body2" color="textSecondary">
                      <Trans>Unsupported commands</Trans>{' '}
                      <TooltipIcon>
                        <Trans>
                          Your current version of the Chia application may not support some commands requested by the
                          dApp. For the best experience, consider updating to the latest version.
                        </Trans>
                      </TooltipIcon>
                      :&nbsp;
                      <Box sx={{ color: 'warning.main', display: 'inline-block' }}>{unsupportedMethods.join(', ')}</Box>
                    </Typography>
                  ) : null}
                </Flex>
              );
            })}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
