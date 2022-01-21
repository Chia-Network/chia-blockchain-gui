import React from 'react';
import { Trans } from '@lingui/macro';
import { AdvancedOptions, Flex, DashboardTitle } from '@chia/core';
import { useGetHarvesterConnectionsQuery } from '@chia/api-react';
import FarmOverview from './overview/FarmOverview';
import FarmLatestBlockChallenges from './FarmLatestBlockChallenges';
import FarmFullNodeConnections from './FarmFullNodeConnections';
import FarmYourHarvesterNetwork from './FarmYourHarvesterNetwork';
import FarmLastAttemptedProof from './FarmLastAttemptedProof';
import usePlots from '../../hooks/usePlots';

export default function Farm() {
  const { hasPlots } = usePlots();
  const { data: connections, isLoading } = useGetHarvesterConnectionsQuery();

  return (
    <> 
      <DashboardTitle>
        <Trans>Farming</Trans>
      </DashboardTitle>
      <Flex flexDirection="column" gap={3}>
        <FarmOverview />

        {hasPlots ? (
          <>
            <FarmLastAttemptedProof />
            <FarmLatestBlockChallenges />
            <AdvancedOptions>
              <Flex flexDirection="column" gap={3}>
                <FarmFullNodeConnections />
                <FarmYourHarvesterNetwork />
              </Flex>
            </AdvancedOptions>
          </>
        ) : (
          <>
            <FarmLatestBlockChallenges />
            {!!connections && (
              <AdvancedOptions>
                <Flex flexDirection="column" gap={3}>
                  <FarmYourHarvesterNetwork />
                </Flex>
              </AdvancedOptions>
            )}
          </>
        )}
      </Flex>
    </>
  );
}
