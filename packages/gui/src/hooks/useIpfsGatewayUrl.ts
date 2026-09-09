import { usePrefs } from '@chia-network/api-react';
import { useMemo } from 'react';

import { DEFAULT_IPFS_GATEWAY_BASE, NFT_IPFS_GATEWAY_URL_PREF, normalizeIpfsGatewayBase } from '../util/ipfs';

// The gateway ipfs:// resources are fetched through while useIpfsGateway is
// on. Unset means the public default. The value is stored already normalized
// (see normalizeIpfsGatewayBase); the main process reads the persisted copy
// at every network call site (electron/utils/ipfsGateway.ts) and applies the
// same normalization, so both sides always agree on the gateway in use.
export default function useIpfsGatewayUrl() {
  return usePrefs<string | undefined>(NFT_IPFS_GATEWAY_URL_PREF, undefined);
}

// The base the main process will actually use: the configured gateway when it
// is usable, otherwise the default. Consumers that must react to a gateway
// change (re-verification, URI validity badges) depend on this value.
export function useIpfsGatewayBase(): string {
  const [gatewayUrl] = useIpfsGatewayUrl();

  return useMemo(() => normalizeIpfsGatewayBase(gatewayUrl) ?? DEFAULT_IPFS_GATEWAY_BASE, [gatewayUrl]);
}
