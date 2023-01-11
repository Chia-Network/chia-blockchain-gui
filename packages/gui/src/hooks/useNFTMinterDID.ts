import { useGetNFTInfoQuery } from '@chia-network/api-react';
import { useMemo } from 'react';

import { didToDIDId } from '../util/dids';
import { launcherIdFromNFTId } from '../util/nfts';
import { stripHexPrefix } from '../util/utils';

export type UseNFTMinterDIDResult = {
  didId: string | undefined;
  hexDIDId: string | undefined;
  didName: string | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

export default function useNFTMinterDID(nftId: string): UseNFTMinterDIDResult {
  const launcherId = launcherIdFromNFTId(nftId);
  const { data: nft, isLoading, error } = useGetNFTInfoQuery({ coinId: launcherId ?? '' });

  const [didId, hexDIDId, didName] = useMemo(() => {
    if (!nft) {
      return [];
    }
    const { minterDid } = nft;
    if (!minterDid) {
      return [];
    }
    const hexDIDIdLocal = stripHexPrefix(minterDid);
    const didIdLocal = didToDIDId(hexDIDIdLocal);
    let didNameLocal;

    if (didIdLocal === 'did:chia:19qf3g9876t0rkq7tfdkc28cxfy424yzanea29rkzylq89kped9hq3q7wd2') {
      didNameLocal = 'Chia Network';
    }

    return [didIdLocal, hexDIDIdLocal, didNameLocal];
  }, [nft]);

  return { didId, hexDIDId, didName, isLoading, error };
}
