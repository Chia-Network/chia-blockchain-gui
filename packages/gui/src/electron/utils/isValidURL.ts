import isURL from 'validator/lib/isURL';

import ipfsToGatewayUrl from '../../util/ipfs';

export default function isValidURL(url: string) {
  if (typeof url !== 'string') {
    return false;
  }

  // isURL applies an FQDN check to the host, which every ipfs://<CID> URI
  // fails (a CID has no top-level domain), so listing 'ipfs' as an allowed
  // protocol is not enough. Validate the HTTPS gateway form instead — it is
  // also the URL the network layer will actually request.
  return isURL(ipfsToGatewayUrl(url), { protocols: ['https'], require_protocol: true });
}
