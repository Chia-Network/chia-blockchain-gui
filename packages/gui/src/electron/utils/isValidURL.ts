import isURL from 'validator/lib/isURL';

import ipfsToGatewayUrl, { isIpfsUrl } from '../../util/ipfs';

// Structural validation only — deliberately independent of the IPFS gateway
// preference. CacheManager consults this check before every cache path
// lookup, so tying it to the preference would strand content that was
// downloaded and hash-verified while the option was on: the cached bytes
// could no longer be served, checksummed, or evicted after switching it off,
// even though serving a local file involves no gateway request. Whether an
// ipfs URI may actually be FETCHED is decided at the network call sites via
// toFetchableUrl (electron/utils/ipfsGateway.ts).
export default function isValidURL(url: string) {
  if (typeof url !== 'string') {
    return false;
  }

  // isURL applies an FQDN check to the host, which every ipfs://<CID> URI
  // fails (a CID has no top-level domain), so listing 'ipfs' as an allowed
  // protocol is not enough — validate the HTTPS gateway form instead.
  return isURL(isIpfsUrl(url) ? ipfsToGatewayUrl(url) : url, { protocols: ['https'], require_protocol: true });
}
