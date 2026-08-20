import { EventEmitter } from 'events';

import { useNFTCoinAdded, useNFTCoinRemoved, useNFTCoinUpdated, useNFTCoinDIDSet } from '@chia-network/api-react';
import { useCallback, useMemo } from 'react';

type Event = {
  type: 'add' | 'remove' | 'updated' | 'didset';
  walletId: string;
};

export default function useNFTCoinEvents() {
  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  // immutable function
  const handleNFTEvent = useCallback(
    (eventType: Event['type'], walletId: string) => {
      events.emit('change', { type: eventType, walletId });
    },
    [events /* immutable */],
  );

  // Subscribe to all events related to NFTs. The callbacks must be stable:
  // useSubscribeToEvent resubscribes whenever the callback identity changes,
  // and a wallet event arriving between the unsubscribe and the new subscribe
  // is silently lost, leaving the gallery stale until a remount.
  const handleCoinAdded = useCallback((data: any) => handleNFTEvent('add', data.walletId), [handleNFTEvent]);
  const handleCoinRemoved = useCallback((data: any) => handleNFTEvent('remove', data.walletId), [handleNFTEvent]);
  const handleCoinUpdated = useCallback((data: any) => handleNFTEvent('updated', data.walletId), [handleNFTEvent]);
  const handleCoinDIDSet = useCallback((data: any) => handleNFTEvent('didset', data.walletId), [handleNFTEvent]);

  useNFTCoinAdded(handleCoinAdded);
  useNFTCoinRemoved(handleCoinRemoved);
  useNFTCoinUpdated(handleCoinUpdated);
  useNFTCoinDIDSet(handleCoinDIDSet);

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
