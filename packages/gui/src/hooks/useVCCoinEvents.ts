import { EventEmitter } from 'events';

import { useVCCoinAdded, useVCCoinRemoved } from '@chia-network/api-react';
import { useCallback, useMemo } from 'react';

type Event = {
  type: 'add' | 'remove';
  walletId: string;
};

export default function useVCCoinEvents() {
  const events = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(Infinity);
    return eventEmitter;
  }, []);

  // immutable function
  const handleVCEvent = useCallback(
    (eventType: Event['type'], walletId: string) => {
      events.emit('change', { type: eventType, walletId });
    },
    [events /* immutable */]
  );

  // Subscribe to all events related to VCs
  useVCCoinAdded((data) => {
    // console.log('Coin Added.......', data, handleVCEvent);
    handleVCEvent('add', data.walletId);
  });

  useVCCoinRemoved((data) => {
    // console.log('Coin removed.......', data);
    handleVCEvent('remove', data.walletId);
  });

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
