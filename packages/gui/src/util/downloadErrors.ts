// How a persisted download failure is read back. Shared by the main process,
// which decides whether to retry a failed URL (electron/CacheManager.ts), and
// the renderer, which classifies NFTs from persisted failures without fetching
// anything (getNFTPreviewStatusFromCache) — the two must agree on which
// failures are final, or the gallery filter hides an NFT whose file the cache
// would happily retry the next time a tile asked for it.

export const MAX_FILE_SIZE_EXCEEDED_ERROR = 'Maximum file size exceeded';

// The messages downloadFile aborts with when nothing at all was received for
// `timeout` ms, and when the whole transfer outran `maxDuration`.
export const INACTIVITY_TIMEOUT_ERROR_PREFIX = 'Request timed out after';
export const DOWNLOAD_DEADLINE_ERROR_PREFIX = 'Request exceeded the';

/** Matches the messages of both timeout errors, including messages that
 * earlier sessions persisted into cache `-info` files. */
export function isDownloadTimeoutError(message: string): boolean {
  return message.startsWith(INACTIVITY_TIMEOUT_ERROR_PREFIX) || message.startsWith(DOWNLOAD_DEADLINE_ERROR_PREFIX);
}

// A download cancelled from our side (invalidation, cache directory change,
// a queued request whose signal fired) — retried on the very next access.
const ABORT_ERRORS = ['Response aborted', 'Request aborted'];

export function isAbortedDownloadError(message: string): boolean {
  return ABORT_ERRORS.includes(message);
}

const HTTP_ERROR_PREFIX = 'HTTP error: ';

// Statuses below 500 that still describe a passing condition of the host
// rather than of the resource. 403 is included because Cloudflare fronts the
// public IPFS gateways (ipfs.io, and nftstorage.link which now redirects to
// it) and answers with a 403 "Just a moment..." bot challenge whenever it is
// in a challenging mood; the file is still there and the next request often
// succeeds. 408/425/429 are the timeout, too-early and rate-limit statuses.
const TRANSIENT_HTTP_STATUSES = new Set([403, 408, 425, 429]);

// Server errors that describe the host itself rather than a passing
// condition: it does not implement the request (501) or the protocol (505).
// Every other 5xx — 500, 502, 503, 504, 507, Cloudflare's 52x — is a gateway
// or origin that may well answer next time.
const PERMANENT_HTTP_STATUSES = new Set([501, 505]);

// Chromium network errors that are properties of the URL, not of the moment: a
// scheme or port the client refuses, a URL it cannot parse, a redirect it will
// not follow. Re-requesting these could only ever fail the same way, so they
// settle like a 404. Certificate errors (net::ERR_CERT_*) are matched by prefix
// below for the same reason. Every other net::ERR_* code — connection resets,
// QUIC/HTTP2 protocol errors, net::ERR_BLOCKED_BY_RESPONSE for a challenge page
// that carries a Cross-Origin-Resource-Policy header — keeps the benefit of the
// doubt. So does a name that did not resolve: Chromium reports that for an
// offline machine, a resolver timeout or a sleep/wake glitch as readily as for
// a name that does not exist, and settling it would leave every preview a user
// first opened offline broken until the cache is cleared. The retry schedule
// in CacheManager bounds what a name that truly never resolves can cost.
const PERMANENT_NET_ERRORS = new Set([
  'net::ERR_INVALID_URL',
  'net::ERR_DISALLOWED_URL_SCHEME',
  'net::ERR_UNKNOWN_URL_SCHEME',
  'net::ERR_UNSAFE_PORT',
  'net::ERR_UNSAFE_REDIRECT',
  'net::ERR_INVALID_REDIRECT',
  'net::ERR_TOO_MANY_REDIRECTS',
  'net::ERR_BLOCKED_BY_CLIENT',
  'net::ERR_BLOCKED_BY_ADMINISTRATOR',
  'net::ERR_FILE_NOT_FOUND',
]);

/** Whether a persisted download failure describes a condition that can clear
 * on its own — a timeout, a gateway/server error, a rate limit or bot
 * challenge, or a Chromium network error — as opposed to a resource that is
 * gone for good (404, 410), a host that cannot serve it (bad certificate, 501)
 * or a local policy (size cap). CacheManager retries these after a cooling-off
 * period instead of keeping the entry poisoned until the whole cache is
 * cleared. Every URL this classifies comes from NFT data the minter wrote, so
 * a failure that can never clear must settle: a retry-eligible verdict on it
 * would re-probe the minter's host for as long as the wallet is open. */
// A failure of this machine rather than of the host: descriptors or disk
// exhausted, a file busy. It clears on its own, and a verdict on the url
// made from it would settle the entry for something the url did nothing.
const TRANSIENT_LOCAL_ERROR_CODES = ['EMFILE', 'ENFILE', 'EAGAIN', 'EBUSY', 'ENOSPC', 'EIO'];

export function isTransientDownloadError(message: string): boolean {
  if (isDownloadTimeoutError(message)) {
    return true;
  }

  if (TRANSIENT_LOCAL_ERROR_CODES.some((code) => message.startsWith(`${code}:`))) {
    return true;
  }

  if (message.startsWith('net::ERR_')) {
    return !PERMANENT_NET_ERRORS.has(message) && !message.startsWith('net::ERR_CERT_');
  }

  if (message.startsWith(HTTP_ERROR_PREFIX)) {
    const status = Number.parseInt(message.slice(HTTP_ERROR_PREFIX.length), 10);
    return (status >= 500 && !PERMANENT_HTTP_STATUSES.has(status)) || TRANSIENT_HTTP_STATUSES.has(status);
  }

  return false;
}
