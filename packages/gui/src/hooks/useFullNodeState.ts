import { BlockchainState } from '@chia-network/api';
import { useGetBlockchainStateQuery } from '@chia-network/api-react';

import FullNodeState from '../constants/FullNodeState';

export default function useFullNodeState(): {
  isLoading: boolean;
  state?: FullNodeState;
  data?: BlockchainState;
  error?: Error;
} {
  const {
    data: blockchainState,
    isLoading,
    error,
  } = useGetBlockchainStateQuery(
    {},
    {
      pollingInterval: 10_000,
    },
  );
  const blockchainSynced = blockchainState?.sync?.synced;
  const blockchainSynching = blockchainState?.sync?.syncMode;

  let state: FullNodeState;
  if (blockchainSynced) {
    state = FullNodeState.SYNCED;
  } else if (blockchainSynching) {
    state = FullNodeState.SYNCHING;
  } else {
    state = FullNodeState.ERROR;
  }

  return {
    isLoading,
    state,
    data: blockchainState,
    error: error as Error,
  };
}
