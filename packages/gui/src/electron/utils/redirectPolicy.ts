import type { ClientRequest } from 'electron';

import isValidURL from './isValidURL';

// Redirect targets are chosen by whoever answers the request: for an NFT
// resource that is the minter's host, or a gateway relaying its content. A
// redirect that stays on the origin the request went to names no new host
// and is always followed: that origin was already accepted, as an NFT URI or
// as the configured gateway, and a gateway on this machine or the local
// network canonicalizes paths this way. A redirect elsewhere is held to the
// rule the requested URL had to meet — https, to a host the structural check
// accepts — and to one more: it may not point at this machine or the local
// network, whatever the scheme, because it names a host the NFT never did,
// although a minter's own https URI to such an address is accepted as
// recorded.
export const MAX_REDIRECTS = 5;
export const REDIRECT_REFUSED_ERROR = 'Redirect refused';
export const TOO_MANY_REDIRECTS_ERROR = 'Too many redirects';

// Names that resolve on this machine or its network by convention:
// localhost, mDNS (.local), the home-network zone, and the reserved
// private-use domain.
const LOCAL_NAMES = ['localhost', 'local', 'home.arpa', 'internal'];

// Whether a host names this machine or a network no NFT resource lives on:
// loopback, link-local, the private ranges, the unspecified and shared
// ranges, and their IPv6 forms (mapped IPv4 included).
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateIpv4(octets: number[]): boolean {
  const [a, b] = octets;
  return (
    a === 0 || // unspecified
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // shared address space
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (LOCAL_NAMES.some((name) => host === name || host.endsWith(`.${name}`))) {
    return true;
  }

  const v4 = IPV4.exec(host);
  if (v4) {
    return isPrivateIpv4(v4.slice(1).map(Number));
  }

  if (host.startsWith('[') && host.endsWith(']')) {
    const v6 = host.slice(1, -1);
    // an IPv4-mapped address, as the URL parser writes it (hex groups) or
    // as it may be typed (dotted)
    const mapped = /^::ffff:(?:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/.exec(v6);
    if (mapped) {
      if (mapped[1]) {
        return isPrivateIpv4(mapped[1].split('.').map(Number));
      }
      const high = parseInt(mapped[2], 16);
      const low = parseInt(mapped[3], 16);
      return isPrivateIpv4([Math.floor(high / 256), high % 256, Math.floor(low / 256), low % 256]);
    }
    // Transition and translation forms that carry an IPv4 address: the
    // deprecated IPv4-compatible form (::a.b.c.d / ::hex:hex), SIIT
    // (::ffff:0:a.b.c.d), NAT64 (64:ff9b::a.b.c.d) and 6to4 (2002:hex:hex::).
    // None is routed to this machine by a modern OS, and a cross-origin
    // redirect must also present a trusted certificate, but the address
    // they name is checked all the same.
    const embedded =
      /^(?:::|::ffff:0:|64:ff9b::)(?:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/.exec(v6);
    const sixToFour = /^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4})(?::|$)/.exec(v6);
    const groups = embedded ? [embedded[2], embedded[3]] : sixToFour ? [sixToFour[1], sixToFour[2]] : undefined;
    if (embedded?.[1]) {
      return isPrivateIpv4(embedded[1].split('.').map(Number));
    }
    if (groups && groups[0] !== undefined && groups[1] !== undefined) {
      const high = parseInt(groups[0], 16);
      const low = parseInt(groups[1], 16);
      return isPrivateIpv4([Math.floor(high / 256), high % 256, Math.floor(low / 256), low % 256]);
    }
    return (
      v6 === '::1' ||
      v6 === '::' ||
      v6.startsWith('fe8') ||
      v6.startsWith('fe9') ||
      v6.startsWith('fea') ||
      v6.startsWith('feb') ||
      v6.startsWith('fec') ||
      v6.startsWith('fed') ||
      v6.startsWith('fee') ||
      v6.startsWith('fef') ||
      v6.startsWith('fc') ||
      v6.startsWith('fd')
    );
  }

  return false;
}

export function isAllowedRedirect(fromUrl: string, toUrl: string): boolean {
  if (typeof toUrl !== 'string') {
    return false;
  }

  let from: URL;
  let to: URL;
  try {
    from = new URL(fromUrl);
    to = new URL(toUrl);
  } catch {
    return false;
  }

  // same origin: no new host, whatever the host is
  if (to.origin === from.origin && to.origin !== 'null') {
    return true;
  }

  // isValidURL accepts an ipfs:// URI by validating its gateway form; a
  // redirect, though, names the URL that would be requested next, and the
  // network stack can only request http(s).
  return to.protocol === 'https:' && !isLocalOrPrivateHost(to.hostname) && isValidURL(toUrl);
}

/** Follows a request's redirects one by one, refusing any that leaves the
 * policy above or exceeds MAX_REDIRECTS. The request must have been created
 * with `redirect: 'manual'`; `refuse` is expected to abort it with the given
 * error, which is deliberately not one the cache retries. */
export default function guardRedirects(
  request: Pick<ClientRequest, 'on' | 'followRedirect'>,
  fromUrl: string,
  refuse: (error: Error) => void,
) {
  let hops = 0;
  let currentUrl = fromUrl;

  request.on('redirect', (_statusCode: number, _method: string, redirectUrl: string) => {
    hops += 1;
    if (hops > MAX_REDIRECTS) {
      refuse(new Error(TOO_MANY_REDIRECTS_ERROR));
      return;
    }

    if (!isAllowedRedirect(currentUrl, redirectUrl)) {
      refuse(new Error(REDIRECT_REFUSED_ERROR));
      return;
    }

    currentUrl = redirectUrl;
    request.followRedirect();
  });
}
