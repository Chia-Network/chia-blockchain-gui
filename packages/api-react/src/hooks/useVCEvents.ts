import { VC } from '@chia-network/api';

import useSubscribeToEvent from './useSubscribeToEvent';

export function useVCCoinAdded(callback: (coin: any) => void) {
  return useSubscribeToEvent('onVCCoinAdded', VC, callback);
}

export function useVCCoinRemoved(callback: (coin: any) => void) {
  return useSubscribeToEvent('onVCCoinRemoved', VC, callback);
}
