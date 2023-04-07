import { useCallback } from 'react';

import { walletApi } from '../services/wallet';
import { useAppDispatch } from '../store';

export default function useLogout() {
  const dispatch = useAppDispatch();

  const handleLogout = useCallback(async () => dispatch(walletApi.util.resetApiState()), [dispatch]);

  return handleLogout;
}
