import { BlockchainState, ServiceName } from '@chia-network/api';

import FarmerStatus from '../constants/FarmerStatus';
import FullNodeState from '../constants/FullNodeState';

import useFullNodeState from './useFullNodeState';
import useIsServiceRunning from './useIsServiceRunning';

export default function useFarmerStatus(): {
  farmerStatus: FarmerStatus;
  blockchainState?: BlockchainState;
} {
  const { state: fullNodeState, isLoading: isLoadingFullNodeState, data: blockchainState } = useFullNodeState();

  const { isRunning, isLoading: isLoadingIsRunning } = useIsServiceRunning(ServiceName.FARMER);

  const isLoading = isLoadingIsRunning || isLoadingFullNodeState;

  if (fullNodeState === FullNodeState.SYNCHING) {
    return {
      farmerStatus: FarmerStatus.SYNCHING,
      blockchainState,
    };
  }

  if (fullNodeState === FullNodeState.ERROR) {
    return {
      farmerStatus: FarmerStatus.NOT_AVAILABLE,
      blockchainState,
    };
  }

  if (isLoading /* || !farmerConnected */) {
    return {
      farmerStatus: FarmerStatus.NOT_CONNECTED,
      blockchainState,
    };
  }

  if (!isRunning) {
    return {
      farmerStatus: FarmerStatus.NOT_RUNNING,
      blockchainState,
    };
  }

  return {
    farmerStatus: FarmerStatus.FARMING,
    blockchainState,
  };
}
