import { net, type IncomingMessage } from 'electron';

import type IpfsGatewayProbeResult from '../../@types/IpfsGatewayProbeResult';
import ipfsToGatewayUrl, { normalizeIpfsGatewayBase } from '../../util/ipfs';

import { isValidRequestURL } from './isValidURL';

// The empty file (CIDv1, raw, sha2-256 of nothing): every gateway can serve it
// without fetching anything, so a probe for it says whether the address names
// a gateway at all rather than whether some content happens to be pinned.
export const IPFS_GATEWAY_PROBE_CID = 'bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku';
// Long enough for a gateway that is merely slow to send its status line, short
// enough that the settings field does not appear frozen after "Update".
export const IPFS_GATEWAY_PROBE_TIMEOUT = 10_000;

/** Asks the gateway at `input` for the empty file once and reports whether
 * the host answered. Only the response status line is waited for; the body is
 * never read and a redirect is not followed — either already proves a host
 * listens at that name and speaks HTTP, which is all the settings field wants
 * to confirm. A wrong address fails here with the network error the tiles
 * would otherwise each report (net::ERR_NAME_NOT_RESOLVED and the like). */
export default async function probeIpfsGateway(
  input: string,
  options: { timeout?: number } = {},
): Promise<IpfsGatewayProbeResult> {
  const { timeout = IPFS_GATEWAY_PROBE_TIMEOUT } = options;
  const gateway = normalizeIpfsGatewayBase(input);
  if (!gateway) {
    throw new Error('Invalid IPFS gateway address');
  }

  const url = ipfsToGatewayUrl(`ipfs://${IPFS_GATEWAY_PROBE_CID}`, gateway);
  if (!isValidRequestURL(url)) {
    throw new Error('Invalid IPFS gateway address');
  }

  const request = net.request({
    method: 'GET',
    url,
    // a redirect is an answer; where it points is not followed
    redirect: 'manual',
  });

  return new Promise<IpfsGatewayProbeResult>((resolve) => {
    let settled = false;
    let timeoutId: NodeJS.Timeout | undefined;

    const settle = (result: Omit<IpfsGatewayProbeResult, 'gateway'>) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve({ gateway, ...result });
    };

    timeoutId = setTimeout(() => {
      settle({ reachable: false, error: `Request timeout after ${timeout}ms` });
      request.abort();
    }, timeout);

    request.on('response', (response: IncomingMessage) => {
      settle({ reachable: true, status: response.statusCode });
      // the status line is all that was wanted
      request.abort();
    });
    request.on('redirect', (statusCode: number) => {
      settle({ reachable: true, status: statusCode });
      request.abort();
    });
    request.on('error', (error: Error) => {
      settle({ reachable: false, error: error.message });
    });
    request.on('abort', () => {
      // an abort not caused by the probe itself (app quitting) — only when nothing else settled it
      settle({ reachable: false, error: 'Request aborted' });
    });
    request.end();
  });
}
