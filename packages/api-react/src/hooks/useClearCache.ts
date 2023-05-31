import { useCallback } from 'react';

import { walletApi } from '../services/wallet';
import { useAppDispatch } from '../store';

export default function useClearCache() {
  const dispatch = useAppDispatch();

  const handleClearCache = useCallback(async () => dispatch(walletApi.util.resetApiState()), [dispatch]);

  return handleClearCache;
}
