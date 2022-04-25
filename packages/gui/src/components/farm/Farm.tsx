import React from 'react';
import { AdvancedOptions, Flex, LayoutDashboardSub, Loading } from '@chia/core';
import { useGetHarvesterConnectionsQuery, useGetTotalHarvestersSummaryQuery } from '@chia/api-react';
import FarmOverview from './overview/FarmOverview';
import FarmLatestBlockChallenges from './FarmLatestBlockChallenges';
import FarmFullNodeConnections from './FarmFullNodeConnections';
import FarmYourHarvesterNetwork from './FarmYourHarvesterNetwork';
import FarmLastAttemptedProof from './FarmLastAttemptedProof';

export default function Farm() {
  const { hasPlots, isLoading } = useGetTotalHarvestersSummaryQuery();
  const { data: connections } = useGetHarvesterConnectionsQuery();

  return (
    <LayoutDashboardSub>
      <Flex flexDirection="column" gap={4}>
        <FarmOverview />

        {isLoading ? (
          <Loading center />
        ) : hasPlots ? (
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
    </LayoutDashboardSub>
  );
}
