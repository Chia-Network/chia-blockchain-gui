import { useMemo } from 'react';

import { didToDIDId } from '../util/dids';
import removeHexPrefix from '../util/removeHexPrefix';
import useNFT from './useNFT';

export type UseNFTMinterDIDResult = {
  didId: string | undefined;
  hexDIDId: string | undefined;
  didName: string | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

export default function useNFTMinterDID(nftId: string): UseNFTMinterDIDResult {
  const { nft, isLoading, error } = useNFT(nftId);

  const [didId, hexDIDId, didName] = useMemo(() => {
    if (!nft) {
      return [];
    }
    const { minterDid } = nft;
    if (!minterDid) {
      return [];
    }
    const hexDIDIdLocal = removeHexPrefix(minterDid);
    const didIdLocal = didToDIDId(hexDIDIdLocal);
    let didNameLocal;

    if (didIdLocal === 'did:chia:19qf3g9876t0rkq7tfdkc28cxfy424yzanea29rkzylq89kped9hq3q7wd2') {
      didNameLocal = 'Chia Network';
    }

    return [didIdLocal, hexDIDIdLocal, didNameLocal];
  }, [nft]);

  return { didId, hexDIDId, didName, isLoading, error };
}
