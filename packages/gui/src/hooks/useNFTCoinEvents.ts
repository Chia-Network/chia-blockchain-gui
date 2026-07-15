import { EventEmitter } from 'events';

import { useNFTCoinAdded, useNFTCoinRemoved, useNFTCoinUpdated, useNFTCoinDIDSet } from '@chia-network/api-react';
import { useCallback, useMemo } from 'react';

type Event = {
  type: 'add' | 'remove' | 'updated' | 'didset';
  walletId: number;
};

export default function useNFTCoinEvents() {
  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  // immutable function
  const handleNFTEvent = useCallback(
    (eventType: Event['type'], walletId: number) => {
      events.emit('change', { type: eventType, walletId });
    },
    [events /* immutable */],
  );

  // Subscribe to all events related to NFTs
  const handleNFTCoinAdded = useCallback(
    (data: { walletId: number }) => handleNFTEvent('add', data.walletId),
    [handleNFTEvent],
  );
  const handleNFTCoinRemoved = useCallback(
    (data: { walletId: number }) => handleNFTEvent('remove', data.walletId),
    [handleNFTEvent],
  );
  const handleNFTCoinUpdated = useCallback(
    (data: { walletId: number }) => handleNFTEvent('updated', data.walletId),
    [handleNFTEvent],
  );
  const handleNFTCoinDIDSet = useCallback(
    (data: { walletId: number }) => handleNFTEvent('didset', data.walletId),
    [handleNFTEvent],
  );

  useNFTCoinAdded(handleNFTCoinAdded);
  useNFTCoinRemoved(handleNFTCoinRemoved);
  useNFTCoinUpdated(handleNFTCoinUpdated);
  useNFTCoinDIDSet(handleNFTCoinDIDSet);

  const subscribe = useCallback(
    (callback: (event?: Event) => void) => {
      events.on('change', callback);
      return () => {
        events.off('change', callback);
      };
    },
    [events],
  );

  return subscribe;
}
