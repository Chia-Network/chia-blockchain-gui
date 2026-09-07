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
    getIpfsGatewayHealth()
      .then((current) => {
        if (!cancelled) {
          setHealth(current ?? undefined);
        }
      })
      .catch(() => {
        // nothing known yet; the subscription below delivers the first verdict
      });
    const unsubscribe = subscribeToIpfsGatewayHealthChange((next) => {
      if (!cancelled) {
        setHealth(next);
      }
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
