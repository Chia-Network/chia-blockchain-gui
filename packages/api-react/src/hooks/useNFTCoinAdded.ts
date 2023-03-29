import { WalletService } from '@chia-network/api';
import { useEffect } from 'react';

import api, { baseQuery } from '../api';

function subscribe(cb: Function) {
  async function process() {
    const { data: unsubscribe } = await baseQuery(
      {
        command: 'onNFTCoinAdded',
        service: WalletService,
        args: [cb],
      },
      api,
      {}
    );

    return unsubscribe;
  }

  const promise = process();

  return () => {
    promise.then((unsubscribe) => unsubscribe);
  };
}

export default function useNFTCoinAdded(callback: (coin: any) => void) {
  useEffect(() => subscribe(callback), [callback]);
}
