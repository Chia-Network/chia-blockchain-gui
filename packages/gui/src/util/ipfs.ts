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

// The longest URL the structural validator accepts (validator's isURL). NFT
// URIs come from the chain with no length limit, and every helper here runs
// on them before validation, so a longer string is refused up front rather
// than worked on: nothing past this length could ever be fetched.
export const MAX_URL_LENGTH = 2084;

// Trailing slashes removed in one pass. The obvious regex, /\/+$/, is
// quadratic on a run of slashes that does not reach the end — a minter can
// put tens of thousands of them in a URI, and the main process would stall
// for seconds on each.
export function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }
  return end === value.length ? value : value.slice(0, end);
}

// Plain http is accepted for a gateway on this machine only (a local Kubo
// node serves http://127.0.0.1:8080 by default); everything else must be
// https like every other NFT resource URL.
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

// An http or https URL on this machine — the one kind of URL the gateway
// setting accepts that the general NFT URL check (electron/utils/isValidURL)
// would refuse: it may be plain http and its host has no top-level domain.
export function isLoopbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && LOOPBACK_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

// Whether a gateway host will pass the check every outgoing request goes
// through (validator's isURL: an IP address, or a name with a top-level
// domain). A gateway that fails it would be accepted here and then fail every
// fetch with "Invalid URL", so it is refused up front instead.
const IPV4_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const HOST_WITH_TLD = /\.(?:[a-z¡-￿]{2,}|xn--[a-z0-9-]+)$/i;

function isRequestableGatewayHost(hostname: string): boolean {
  return (
    LOOPBACK_HOSTS.has(hostname) ||
    hostname.startsWith('[') || // IPv6 literal
    IPV4_HOST.test(hostname) ||
    HOST_WITH_TLD.test(hostname)
  );
}

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
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
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
  if ((!isHttps && !isLoopbackHttp) || !parsed.hostname || !isRequestableGatewayHost(parsed.hostname)) {
    return undefined;
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return undefined;
  }

  const basePath = trimTrailingSlashes(parsed.pathname).replace(/\/ipfs$/i, '');

  return `${parsed.origin}${basePath}/ipfs/`;
}

const IPFS_SCHEME = /^ipfs:\/\//i;

export function isIpfsUrl(url: string): boolean {
  return typeof url === 'string' && IPFS_SCHEME.test(url);
}

// A CID is base58btc (v0) or base32/base36 (v1): letters and digits only.
const CID_SEGMENT = /^[A-Za-z0-9]+$/;
// What a path segment must not contain once it is appended to a gateway base:
// a backslash (URL parsing turns it into a slash), whitespace or a control
// character (a URL with either is not valid to begin with — a newline would be
// stripped by the parser, a space refused by isValidURL). `/`, `?` and `#`
// cannot occur: the path was split on the first and cut at the others.
// Everything else — Unicode file names, brackets, quotes — is a legitimate
// path character that NFTs use; the URL parser percent-encodes what needs it.
const FORBIDDEN_IN_SEGMENT = /[\\\s\p{Cc}]/u;
// `.`, `..` and their percent-encoded spellings, which URL resolution walks
// back up — out of the gateway's /ipfs/ prefix.
const DOT_SEGMENT = /^(?:\.|%2e){1,2}$/i;

// Whether `<CID>[/path]` names IPFS content and nothing else. The value comes
// from NFT data the minter wrote and ends up appended to a gateway base, so
// a first segment that is not a CID, or any segment that would resolve
// somewhere other than under the base, disqualifies the whole path.
export function isIpfsPath(ipfsPath: string): boolean {
  const [cid, ...segments] = ipfsPath.split('/');

  return (
    CID_SEGMENT.test(cid) &&
    segments.every((segment) => segment.length > 0 && !FORBIDDEN_IN_SEGMENT.test(segment) && !DOT_SEGMENT.test(segment))
  );
}

// Returns the `<CID>[/path]` part of an ipfs:// URI, tolerating the redundant
// `ipfs://ipfs/<CID>` form produced by some minting tools. CIDv0 hashes are
// case-sensitive base58, so the value is never case-normalized. A query string
// is kept; a trailing slash is dropped. Returns undefined when what follows
// the scheme does not name IPFS content (see isIpfsPath), so the URI is
// treated like any other URL the gateway cannot serve.
export function getIpfsPath(url: string): string | undefined {
  if (!isIpfsUrl(url) || url.length > MAX_URL_LENGTH) {
    return undefined;
  }

  const [, ipfsPath, query] = /^([^?#]*)(.*)$/s.exec(url.replace(IPFS_SCHEME, '').replace(/^ipfs\//i, '')) ?? [];
  const trimmedPath = trimTrailingSlashes(ipfsPath);

  return trimmedPath.length > 0 && isIpfsPath(trimmedPath) ? `${trimmedPath}${query}` : undefined;
}

// Translates an ipfs:// URI to its HTTPS gateway equivalent. Anything else
// (including an unusable bare `ipfs://`) is returned unchanged, so this can
// wrap any URL right where it reaches the network layer. `gatewayBase` is a
// normalized base (see normalizeIpfsGatewayBase); it defaults to the public
// gateway. Whatever the path looked like, the URL handed back resolves under
// the base — an ipfs URI that would land anywhere else is returned unchanged
// and so fails validation.
export default function ipfsToGatewayUrl(url: string, gatewayBase: string = DEFAULT_IPFS_GATEWAY_BASE): string {
  const ipfsPath = getIpfsPath(url);
  if (ipfsPath === undefined) {
    return url;
  }

  try {
    const resolved = new URL(`${gatewayBase}${ipfsPath}`);
    return resolved.href.startsWith(gatewayBase) ? resolved.href : url;
  } catch {
    return url;
  }
}
