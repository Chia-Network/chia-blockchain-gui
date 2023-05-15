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
    [events /* immutable */]
  );

  // Subscribe to all events related to NFTs
  useNFTCoinAdded((data) => handleNFTEvent('add', data.walletId));
  useNFTCoinRemoved((data) => handleNFTEvent('remove', data.walletId));
  useNFTCoinUpdated((data) => handleNFTEvent('updated', data.walletId));
  useNFTCoinDIDSet((data) => handleNFTEvent('didset', data.walletId));

  const subscribe = useCallback(
    (callback: (event?: Event) => void) => {
      events.on('change', callback);
      return () => {
        events.off('change', callback);
      };
    },
    [events]
  );

  return subscribe;
}
