import { useEffect, useMemo, useState } from 'react';

import type IpfsGatewayHealth from '../@types/IpfsGatewayHealth';

import useCache from './useCache';
import useIpfsGateway from './useIpfsGateway';
import { useIpfsGatewayBase } from './useIpfsGatewayUrl';

// What the main process has learned about the configured IPFS gateway from
// the downloads it made through it (see IpfsGatewayHealth) — undefined while
// nothing is known, while the gateway option is off, and for a verdict on a
// gateway other than the one currently configured, so a stale verdict on the
// previous address never outlives a change of address.
export default function useIpfsGatewayHealth(): IpfsGatewayHealth | undefined {
  const { getIpfsGatewayHealth, subscribeToIpfsGatewayHealthChange } = useCache();
  const [ipfsGateway] = useIpfsGateway();
  const gatewayBase = useIpfsGatewayBase();
  const [health, setHealth] = useState<IpfsGatewayHealth | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // The snapshot is a round trip behind the subscription: a verdict announced
    // while it was in flight is newer than what it returns, and must not be
    // overwritten by it.
    let announced = false;
    const unsubscribe = subscribeToIpfsGatewayHealthChange((next) => {
      if (!cancelled) {
        announced = true;
        setHealth(next);
      }
    });
    getIpfsGatewayHealth()
      .then((current) => {
        if (!cancelled && !announced) {
          setHealth(current ?? undefined);
        }
      })
      .catch(() => {
        // nothing known yet; the subscription delivers the first verdict
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [getIpfsGatewayHealth, subscribeToIpfsGatewayHealthChange]);

  return useMemo(
    () => (ipfsGateway && health && health.gateway === gatewayBase ? health : undefined),
    [ipfsGateway, health, gatewayBase],
  );
}
