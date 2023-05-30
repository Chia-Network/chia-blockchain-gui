import { WalletService } from '@chia-network/api';

import useSubscribeToEvent from './useSubscribeToEvent';

export function useVCCoinAdded(callback: (coin: any) => void) {
  return useSubscribeToEvent('onVCCoinAdded', WalletService, callback);
}

export function useVCCoinRemoved(callback: (coin: any) => void) {
  return useSubscribeToEvent('onVCCoinRemoved', WalletService, callback);
}
