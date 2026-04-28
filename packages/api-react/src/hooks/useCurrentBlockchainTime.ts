import { useGetTimestampForHeightQuery } from '../services';

import useGetWalletHeightInfoQuery from './useGetWalletHeightInfoQuery';

/**
 * Consolidates the repeated pattern of fetching the current blockchain timestamp:
 * 1. get_height_info (with optional latestTimestamp)
 * 2. fallback to get_timestamp_for_height when latestTimestamp is unavailable
 *
 * Returns the resolved timestamp (seconds since epoch) and a combined loading flag.
 */
export default function useCurrentBlockchainTime(pollingInterval = 3000) {
  const { data: heightInfo, isLoading: isHeightInfoLoading } = useGetWalletHeightInfoQuery({
    pollingInterval,
  });

  const syncHeight = heightInfo?.height ?? 0;
  const preferLatestTs = heightInfo?.latestTimestamp != null && heightInfo.latestTimestamp > 0;

  const { data: timestampForHeightData, isLoading: isTimestampForHeightLoading } = useGetTimestampForHeightQuery(
    { height: syncHeight },
    { skip: !syncHeight || preferLatestTs },
  );

  const timestamp = preferLatestTs ? heightInfo!.latestTimestamp : (timestampForHeightData?.timestamp ?? 0);

  return {
    timestamp,
    isLoading: isHeightInfoLoading || isTimestampForHeightLoading,
  };
}
