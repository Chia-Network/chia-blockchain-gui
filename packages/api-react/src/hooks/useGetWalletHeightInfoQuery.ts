import { useGetHeightInfoQuery } from '../services';
import { useTypedSelector } from '../store';
import type { RootState } from '../store';

/**
 * Height info query that respects Settings → Advanced “Use blockchain peak height”.
 */
export default function useGetWalletHeightInfoQuery(options?: Parameters<typeof useGetHeightInfoQuery>[1]) {
  const usePeakHeight = useTypedSelector((s: RootState) => s.walletRpcPreferences.usePeakHeightForHeightInfo);
  return useGetHeightInfoQuery({ usePeakHeight }, options);
}
