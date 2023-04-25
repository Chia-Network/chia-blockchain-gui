import { useGetHarvesterConnectionsQuery, useGetTotalHarvestersSummaryQuery } from '@chia-network/api-react';
import { AdvancedOptions, Flex, LayoutDashboardSub, Loading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React from 'react';

import FarmFullNodeConnections from './FarmFullNodeConnections';
import FarmHeader from './FarmHeader';
import FarmHero from './FarmHero';
import FarmLastAttemptedProof from './FarmLastAttemptedProof';
import FarmLatestBlockChallenges from './FarmLatestBlockChallenges';
import FarmYourHarvesterNetwork from './FarmYourHarvesterNetwork';
import HarvesterLatencyGraph from './HarvesterLatenchGraph';
import FarmCards from './card/FarmCards';

export default function Farm() {
  const { hasPlots, initialized, isLoading } = useGetTotalHarvestersSummaryQuery();
  const { data: connections } = useGetHarvesterConnectionsQuery();

  const showLoading = isLoading || (!hasPlots && !initialized);

  return (
    <LayoutDashboardSub>
      <Flex flexDirection="column" gap={2}>
        {showLoading ? (
          <Loading center>
            <Trans>Loading farming data</Trans>
          </Loading>
        ) : hasPlots ? (
          <>
            <FarmHeader />
            <Flex flexDirection="column" gap={4}>
              <FarmCards />
              <FarmLastAttemptedProof />
              <FarmLatestBlockChallenges />
              <HarvesterLatencyGraph />
              <AdvancedOptions>
                <Flex flexDirection="column" gap={3}>
                  <FarmFullNodeConnections />
                  <FarmYourHarvesterNetwork />
                </Flex>
              </AdvancedOptions>
            </Flex>
          </>
        ) : (
          <>
            <FarmHeader />
            <Flex flexDirection="column" gap={4}>
              <FarmHero />
              <FarmLatestBlockChallenges />
              {!!connections && (
                <AdvancedOptions>
                  <Flex flexDirection="column" gap={3}>
                    <FarmYourHarvesterNetwork />
                  </Flex>
                </AdvancedOptions>
              )}
            </Flex>
          </>
        )}
      </Flex>
    </LayoutDashboardSub>
  );
}
