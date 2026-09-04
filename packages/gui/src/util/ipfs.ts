// The public HTTPS gateway used to serve ipfs:// resources unless the user
// configured another one. Electron's net stack has no IPFS support, so
// ipfs:// URIs are fetched through a gateway. The gateway does not need to be
// trusted for integrity: everything the cache serves is checked against the
// NFT's on-chain hash before it is shown.
export const DEFAULT_IPFS_GATEWAY_BASE = 'https://ipfs.io/ipfs/';

// Preference key holding the user's gateway choice, shared by the renderer
// (useIpfsGatewayUrl) and the main process (electron/utils/ipfsGateway.ts),
// which reads the persisted copy at every network call site. The stored value
// is the normalized base — see normalizeIpfsGatewayBase.
export const NFT_IPFS_GATEWAY_URL_PREF = 'nftIpfsGatewayUrl';

// Plain http is accepted for a gateway on this machine only (a local Kubo
// node serves http://127.0.0.1:8080 by default); everything else must be
// https like every other NFT resource URL.
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

// Turns whatever the user typed into the base every ipfs path is appended
// to: `https://dweb.link`, `https://dweb.link/ipfs` and `https://dweb.link/ipfs/`
// all become `https://dweb.link/ipfs/`. Returns undefined for anything that
// cannot serve as a gateway — no scheme, a non-https host, credentials, a
// query string or fragment — so callers fall back to the default instead of
// building unfetchable URLs. Only path-style gateways are supported;
// subdomain gateways would need the CID re-encoded per request.
export function normalizeIpfsGatewayBase(input: string | undefined | null): string | undefined {
  if (typeof input !== 'string') {
    return undefined;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }

  const isHttps = parsed.protocol === 'https:';
  const isLoopbackHttp = parsed.protocol === 'http:' && LOOPBACK_HOSTS.has(parsed.hostname);
  if ((!isHttps && !isLoopbackHttp) || !parsed.hostname) {
    return undefined;
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return undefined;
  }

  const basePath = parsed.pathname.replace(/\/+$/, '').replace(/\/ipfs$/i, '');

  return `${parsed.origin}${basePath}/ipfs/`;
}

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
// wrap any URL right where it reaches the network layer. `gatewayBase` is a
// normalized base (see normalizeIpfsGatewayBase); it defaults to the public
// gateway.
export default function ipfsToGatewayUrl(url: string, gatewayBase: string = DEFAULT_IPFS_GATEWAY_BASE): string {
  const ipfsPath = getIpfsPath(url);

  return ipfsPath === undefined ? url : `${gatewayBase}${ipfsPath}`;
}
