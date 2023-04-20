import { useEffect } from 'react';

import type ServiceConstructor from '../@types/ServiceConstructor';
import api, { baseQuery } from '../api';

function subscribe(event: string, service: ServiceConstructor, cb: Function) {
  async function process() {
    const { data: unsubscribe } = await baseQuery(
      {
        command: event,
        service,
        args: [cb],
      },
      api
    );

    return unsubscribe;
  }

  const promise = process();

  return () => {
    promise.then((unsubscribe) => unsubscribe);
  };
}

export default function useSubscribeToEvent(event: string, service: ServiceConstructor, callback: (coin: any) => void) {
  useEffect(() => subscribe(event, service, callback), [event, service, callback]);
}
