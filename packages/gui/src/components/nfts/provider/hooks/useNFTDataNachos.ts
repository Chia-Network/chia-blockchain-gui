import { EventEmitter } from 'events';

import { type NFTInfo } from '@chia-network/api';
import debug from 'debug';
import { useState, useCallback, useMemo } from 'react';

import type NFTState from '../../../../@types/NFTState';
import useNachoNFTs from '../../../../hooks/useNachoNFTs';
import getNFTId from '../../../../util/getNFTId';
import { getChangedEventName } from './useNFTDataOnDemand';

const log = debug('chia-gui:NFTProvider:useMetadataData');

// warning: only used by NFTProvider
export default function useNFTDataNachos() {
  const { data: nachoNFTs, isLoading, error } = useNachoNFTs();
  const [nachos /* immutable */] = useState(() => new Map<string, NFTInfo>());

  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  useMemo(() => {
    log('Preparing nacho NFTs');
    nachos.clear();

    if (nachoNFTs) {
      nachos.clear();
      nachoNFTs.forEach((nachoNFT: NFTInfo) => {
        const nftId = getNFTId(nachoNFT.launcherId);
        nachos.set(nftId, nachoNFT);

        events.emit(getChangedEventName(nftId), {
          nft: nachoNFT,
          isLoading: false,
        });

        events.emit('changed');
      });
    }
  }, [nachos, nachoNFTs, events]);

  // immutable function
  const getNFTNacho = useCallback(
    (id: string | undefined): NFTState => {
      if (!id) {
        return {
          nft: undefined,
          isLoading: false,
          error: new Error('Invalid NFT id'),
        };
      }

      const nftId = getNFTId(id);

      return {
        nft: nachos.get(nftId),
        isLoading: false,
      };
    },
    [nachos /* immutable */]
  );

  // immutable function
  const onNFTChanges = useCallback(
    (id: string | undefined, callback: (nftState?: NFTState) => void) => {
      if (!id) {
        return () => {};
      }

      const nftId = getNFTId(id);
      const eventName = getChangedEventName(nftId);
      events.on(eventName, callback);

      return () => {
        events.off(eventName, callback);
      };
    },
    [events /* immutable */]
  );

  const onChange = useCallback(
    (callback: () => void) => {
      events.on('changed', callback);

      return () => {
        events.off('changed', callback);
      };
    },
    [events]
  );

  return {
    nachos, // immutable
    getNFTNacho, // immutable
    onNFTNachosChange: onNFTChanges, // immutable
    onNachosChange: onChange, // immutable
    isLoading,
    error,
  } as const;
}
