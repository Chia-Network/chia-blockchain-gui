import isURL from 'validator/lib/isURL';

import maybeIpfsToGatewayUrl from './ipfsGateway';

export default function isValidURL(url: string) {
  if (typeof url !== 'string') {
    return false;
  }

  // isURL applies an FQDN check to the host, which every ipfs://<CID> URI
  // fails (a CID has no top-level domain), so listing 'ipfs' as an allowed
  // protocol is not enough. When the user has enabled gateway fetching,
  // validate the HTTPS gateway form instead — it is also the URL the network
  // layer will actually request; while the option is off, ipfs URIs stay
  // invalid and are never fetched.
  return isURL(maybeIpfsToGatewayUrl(url), { protocols: ['https'], require_protocol: true });
}
