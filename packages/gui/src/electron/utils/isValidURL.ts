import isURL from 'validator/lib/isURL';

import ipfsToGatewayUrl, { MAX_URL_LENGTH, isIpfsUrl, isLoopbackUrl } from '../../util/ipfs';

// Structural validation only — deliberately independent of the IPFS gateway
// preference. CacheManager consults this check before every cache path
// lookup, so tying it to the preference would strand content that was
// downloaded and hash-verified while the option was on: the cached bytes
// could no longer be served, checksummed, or evicted after switching it off,
// even though serving a local file involves no gateway request. Whether an
// ipfs URI may actually be FETCHED is decided at the network call sites via
// toFetchableUrl (electron/utils/ipfsGateway.ts).
export default function isValidURL(url: string) {
  // Nothing past the validator's length limit could be fetched; refusing it
  // here keeps the ipfs translation below off a string a minter sized.
  if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) {
    return false;
  }

  // isURL applies an FQDN check to the host, which every ipfs://<CID> URI
  // fails (a CID has no top-level domain), so listing 'ipfs' as an allowed
  // protocol is not enough — validate the HTTPS gateway form instead.
  return isURL(isIpfsUrl(url) ? ipfsToGatewayUrl(url) : url, { protocols: ['https'], require_protocol: true });
}

// The URL the network layer is about to request. isValidURL checks an NFT URL
// as recorded — for an ipfs:// URI, its public-gateway form — but the request
// itself may go to the gateway the user configured, so the string actually
// handed to net.request is checked again right before it is used, with the
// one exception the gateway setting deliberately allows: a gateway on this
// machine, whose host has no top-level domain and may be plain http. An
// ipfs:// URI is never requestable as such — only its translation is.
export function isValidRequestURL(requestUrl: string): boolean {
  if (isIpfsUrl(requestUrl)) {
    return false;
  }

  return isValidURL(requestUrl) || isLoopbackUrl(requestUrl);
}
