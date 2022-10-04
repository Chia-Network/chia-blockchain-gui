import { useMemo } from 'react';
import { useGetNFTInfoQuery } from '@chia/api-react';
import { launcherIdFromNFTId } from '../util/nfts';
import { stripHexPrefix } from '../util/utils';
import { didToDIDId } from '../util/dids';

export type UseNFTMinterDIDResult = {
  didId: string | undefined;
  hexDIDId: string | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

export default function useNFTMinterDID(nftId: string): UseNFTMinterDIDResult {
  const launcherId = launcherIdFromNFTId(nftId);
  const {
    data: nft,
    isLoading,
    error,
  } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });

  const { didId, hexDIDId } = useMemo(() => {
    if (!nft) {
      return undefined;
    }
    const { minterDid } = nft;
    if (!minterDid) {
      return undefined;
    }
    const hexDIDId = stripHexPrefix(minterDid);
    const didId = didToDIDId(hexDIDId);

    if (
      didId ===
      'did:chia:19qf3g9876t0rkq7tfdkc28cxfy424yzanea29rkzylq89kped9hq3q7wd2'
    ) {
      return { didId: 'Chia Network', hexDIDId };
    }

    return { didId, hexDIDId };
  }, [nft]);

  return { didId, hexDIDId, isLoading, error };
}
