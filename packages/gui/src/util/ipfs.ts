// The public HTTPS gateway used to serve ipfs:// resources. Electron's net
// stack has no IPFS support, so ipfs:// URIs are fetched through a gateway.
// The gateway does not need to be trusted for integrity: everything the cache
// serves is checked against the NFT's on-chain hash before it is shown.
export const IPFS_GATEWAY_BASE = 'https://ipfs.io/ipfs/';

const IPFS_SCHEME = /^ipfs:\/\//i;

export function isIpfsUrl(url: string): boolean {
  return typeof url === 'string' && IPFS_SCHEME.test(url);
}

// Returns the `<CID>[/path]` part of an ipfs:// URI, tolerating the redundant
// `ipfs://ipfs/<CID>` form produced by some minting tools. CIDv0 hashes are
// case-sensitive base58, so the value is never case-normalized.
export function getIpfsPath(url: string): string | undefined {
  if (!isIpfsUrl(url)) {
    return undefined;
  }

  const ipfsPath = url.replace(IPFS_SCHEME, '').replace(/^ipfs\//i, '');

  return ipfsPath.length > 0 ? ipfsPath : undefined;
}

// Translates an ipfs:// URI to its HTTPS gateway equivalent. Anything else
// (including an unusable bare `ipfs://`) is returned unchanged, so this can
// wrap any URL right where it reaches the network layer.
export default function ipfsToGatewayUrl(url: string): string {
  const ipfsPath = getIpfsPath(url);

  return ipfsPath === undefined ? url : `${IPFS_GATEWAY_BASE}${ipfsPath}`;
}
