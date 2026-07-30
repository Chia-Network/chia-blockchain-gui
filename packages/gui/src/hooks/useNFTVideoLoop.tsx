import { usePrefs } from '@chia-network/api-react';
import { useCallback } from 'react';

// Global preference: when enabled, every NFT video loops, regardless of the
// per-video preference. When disabled, looping is controlled per video.
export function useNFTVideoLoopGlobal(): [boolean, (loopVideos: boolean) => void] {
  return usePrefs<boolean>('nftVideoLoop', false);
}

type NFTVideoLoopMap = Record<string, boolean>;

// Per-video preference, keyed by NFT id. Only enabled videos are stored, so
// the preferences file stays clean.
export function useNFTVideoLoopForNFT(nftId: string): [boolean, (loopVideo: boolean) => void] {
  const [loopMap, setLoopMap] = usePrefs<NFTVideoLoopMap>('nftVideoLoopByNftId', {});

  const loop = !!loopMap?.[nftId];

  const setLoop = useCallback(
    (loopVideo: boolean) => {
      setLoopMap((currentMap) => {
        const nextMap = { ...currentMap };
        if (loopVideo) {
          nextMap[nftId] = true;
        } else {
          delete nextMap[nftId];
        }
        return nextMap;
      });
    },
    [nftId, setLoopMap],
  );

  return [loop, setLoop];
}

// The effective looping state for one NFT video: the global preference forces
// looping on when set, but never disables a video's own loop preference.
export default function useNFTVideoLoop(nftId: string): boolean {
  const [globalLoop] = useNFTVideoLoopGlobal();
  const [videoLoop] = useNFTVideoLoopForNFT(nftId);

  return globalLoop || videoLoop;
}
