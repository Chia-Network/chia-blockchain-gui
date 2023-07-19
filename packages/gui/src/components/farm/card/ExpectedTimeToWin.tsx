import { useGetBlockchainStateQuery, useGetTotalHarvestersSummaryQuery } from '@chia-network/api-react';
import { State, CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import React, { useMemo } from 'react';

import FullNodeState from '../../../constants/FullNodeState';
import useFullNodeState from '../../../hooks/useFullNodeState';
import FarmCardNotAvailable from './FarmCardNotAvailable';

export default React.memo(ExpectedTimeToWin);
function ExpectedTimeToWin() {
  const { state: fullNodeState } = useFullNodeState();

  const { data, isLoading: isLoadingBlockchainState, error: errorBlockchainState } = useGetBlockchainStateQuery();
  const {
    totalEffectivePlotSize,
    isLoading: isLoadingTotalHarvesterSummary,
    error: errorLoadingPlots,
  } = useGetTotalHarvestersSummaryQuery();

  const isLoading = isLoadingBlockchainState || isLoadingTotalHarvesterSummary;
  const error = errorBlockchainState || errorLoadingPlots;

  const totalNetworkSpace = useMemo(() => new BigNumber(data?.space ?? 0), [data]);

  const proportion = useMemo(() => {
    if (isLoading || totalNetworkSpace.isZero()) {
      return new BigNumber(0);
    }

    return totalEffectivePlotSize.div(totalNetworkSpace);
  }, [isLoading, totalEffectivePlotSize, totalNetworkSpace]);

  const expectedTimeToWin = React.useMemo(() => {
    if (fullNodeState !== FullNodeState.SYNCED || !data) {
      return null;
    }

    const averageBlockMinutes = data.averageBlockTime / 60;
    const minutes = !proportion.isZero() ? new BigNumber(averageBlockMinutes).div(proportion) : new BigNumber(0);

    return moment
      .duration({
        minutes: minutes.toNumber(),
      })
      .humanize();
  }, [proportion, data, fullNodeState]);

  if (fullNodeState !== FullNodeState.SYNCED) {
    const state = fullNodeState === FullNodeState.SYNCHING ? State.WARNING : undefined;

    return <FarmCardNotAvailable title={<Trans>Estimated Time to Win</Trans>} state={state} />;
  }

  return (
    <CardSimple
      title={<Trans>Estimated Time to Win</Trans>}
      value={`${expectedTimeToWin}`}
      tooltip={
        <Trans>
          You have {(proportion * 100).toFixed(4)}% of the space on the network, so farming a block will take{' '}
          {expectedTimeToWin} in expectation. Actual results may take 3 to 4 times longer than this estimate.
        </Trans>
      }
      loading={isLoading}
      error={error}
    />
  );
}
