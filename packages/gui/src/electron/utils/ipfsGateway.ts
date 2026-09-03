import ipfsToGatewayUrl, {
  DEFAULT_IPFS_GATEWAY_BASE,
  NFT_IPFS_GATEWAY_URL_PREF,
  isIpfsUrl,
  normalizeIpfsGatewayBase,
} from '../../util/ipfs';
import { readPrefs } from '../prefs';

// Preference key shared with the renderer's useIpfsGateway hook. The renderer
// persists it through PreferencesAPI.SAVE into prefs.yaml, which is the copy
// consulted here in the main process.
export const NFT_IPFS_GATEWAY_PREF = 'nftIpfsGateway';

// Whether ipfs:// NFT resources may be fetched through the public HTTPS
// gateway. Off by default: the gateway URL is not the URI recorded on chain,
// so the translation is a user-selectable opt-in. Fails closed when the
// preferences store is unreadable (e.g. before userData is initialized).
export function ipfsGatewayEnabled(): boolean {
  try {
    return readPrefs()[NFT_IPFS_GATEWAY_PREF] === true;
  } catch {
    return false;
  }
}

// The gateway base ipfs paths are appended to: the user's choice when it is
// set and usable, otherwise the public default. Falls back to the default
// when the preferences store is unreadable, like ipfsGatewayEnabled.
export function ipfsGatewayBase(): string {
  try {
    return normalizeIpfsGatewayBase(readPrefs()[NFT_IPFS_GATEWAY_URL_PREF]) ?? DEFAULT_IPFS_GATEWAY_BASE;
  } catch {
    return DEFAULT_IPFS_GATEWAY_BASE;
  }
}

// Translates an ipfs:// URI to its HTTPS gateway equivalent only when the
// user has enabled gateway fetching; every other URL — and every ipfs URI
// while the option is off — is returned unchanged, so this can wrap any URL
// right where it reaches the network layer. The ipfs check runs first so the
// hot non-ipfs paths never touch the preferences store.
export default function maybeIpfsToGatewayUrl(url: string): string {
  if (!isIpfsUrl(url) || !ipfsGatewayEnabled()) {
    return url;
  }

  return ipfsToGatewayUrl(url, ipfsGatewayBase());
}

// Thrown instead of attempting a fetch that cannot happen: with the gateway
// option off there is no URL Electron's net stack could request for an
// ipfs:// URI. CacheManager treats this error as non-persistent — flipping
// the option on must retry cleanly, so it never poisons a cache entry.
export class IpfsGatewayDisabledError extends Error {
  constructor() {
    super('IPFS gateway fetching is disabled');
    this.name = 'IpfsGatewayDisabledError';
  }
}

// The URL the network layer may actually request. The gateway option gates
// only fetching: structural URL validation and serving already-cached content
// stay independent of it, so every network call site funnels through here
// instead of checking the option itself.
export function toFetchableUrl(url: string): string {
  const requestUrl = maybeIpfsToGatewayUrl(url);
  if (isIpfsUrl(requestUrl)) {
    throw new IpfsGatewayDisabledError();
  }

  return requestUrl;
}
