import type CacheInfo from '../@types/CacheInfo';
import CacheState from '../constants/CacheState';

import { getGatewayHost, getIpfsPathFromAnyUrl, isIpfsUrl } from './ipfs';

// Where the file behind an NFT URI came from, for display (NFTSourceStatus).
//
// - `web`: the URI does not name IPFS content; its own host served it.
// - `ipfs` with `viaGateway: false`: a gateway link (https://…/ipfs/<CID>)
//   served by the host in the link.
// - `ipfs` with `viaGateway: true`: IPFS content the configured gateway
//   produced — an ipfs:// URI (its only route), or a gateway link whose own
//   host failed and got the fallback. `host` is the gateway's, taken from the
//   cache sidecar; undefined for an ipfs:// file cached before sidecars
//   recorded the gateway (which gateway it was is not known, that one was
//   used is).
export type NFTSource =
  | { kind: 'web'; host: string }
  | { kind: 'ipfs'; host: string | undefined; ipfsPath: string; viaGateway: boolean };

export default function getNFTSource(uri: string, cacheInfo?: CacheInfo): NFTSource | undefined {
  const ipfsPath = getIpfsPathFromAnyUrl(uri);
  if (ipfsPath === undefined) {
    let host: string;
    try {
      host = new URL(uri).hostname;
    } catch {
      return undefined;
    }

    return host ? { kind: 'web', host } : undefined;
  }

  const gateway = cacheInfo?.state === CacheState.CACHED ? cacheInfo.gateway : undefined;
  if (gateway !== undefined) {
    return { kind: 'ipfs', host: getGatewayHost(gateway), ipfsPath, viaGateway: true };
  }

  if (isIpfsUrl(uri)) {
    return { kind: 'ipfs', host: undefined, ipfsPath, viaGateway: true };
  }

  return { kind: 'ipfs', host: getGatewayHost(uri), ipfsPath, viaGateway: false };
}
