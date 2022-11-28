import type { NFTInfo } from '@chia/api';
import { useGetNFTsQuery } from '@chia/api-react';
import { useMemo } from 'react';

type UseFetchNFTsResult = {
  nfts: NFTInfo[];
  isLoading: boolean;
};

export default function useFetchNFTs(
  walletIds: number[],
  queryOpts: undefined | Record<string, any> = {}
): UseFetchNFTsResult {
  const { data, isLoading }: { data: { [walletId: number]: NFTInfo[] }; isLoading: boolean } = useGetNFTsQuery(
    { walletIds },
    queryOpts
  );
  const nfts = useMemo(
    () =>
      // Convert [ { <wallet_id>: IncompleteNFTInfo[] }, { <wallet_id>: IncompleteNFTInfo[] } ] to NFTInfo[]
      Object.entries(data ?? []).flatMap(([walletId, nfts]) =>
        nfts.map((nft) => ({
          ...nft,
          walletId: Number(walletId), // Add in the source wallet id
        }))
      ),
    [data, isLoading]
  );

  return { isLoading, nfts };
}
