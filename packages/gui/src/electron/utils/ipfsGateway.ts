import ipfsToGatewayUrl, { isIpfsUrl } from '../../util/ipfs';
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

// Translates an ipfs:// URI to its HTTPS gateway equivalent only when the
// user has enabled gateway fetching; every other URL — and every ipfs URI
// while the option is off — is returned unchanged, so this can wrap any URL
// right where it reaches the network layer. The ipfs check runs first so the
// hot non-ipfs paths never touch the preferences store.
export default function maybeIpfsToGatewayUrl(url: string): string {
  if (!isIpfsUrl(url) || !ipfsGatewayEnabled()) {
    return url;
  }

  return ipfsToGatewayUrl(url);
}
