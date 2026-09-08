import { net, IncomingMessage } from 'electron';

import { toFetchableUrl } from './ipfsGateway';
import isValidURL, { isValidRequestURL } from './isValidURL';
import guardRedirects from './redirectPolicy';

const DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export default async function fetchJSON<TData>(
  url: string,
  options?: { method?: string; headers?: Record<string, string>; timeout?: number; maxSize?: number },
): Promise<TData> {
  const { method = 'GET', headers = {}, timeout = DEFAULT_TIMEOUT, maxSize = DEFAULT_MAX_SIZE } = options || {};

  if (!isValidURL(url)) {
    throw new Error('Invalid URL');
  }

  // ipfs:// URIs are fetched through an HTTPS gateway when the user has
  // enabled it — Electron's net stack cannot request the ipfs scheme, and
  // with the option off toFetchableUrl refuses the fetch outright. The
  // translated URL is the one that leaves the machine, so it is validated too.
  const requestUrl = toFetchableUrl(url);
  if (!isValidRequestURL(requestUrl)) {
    throw new Error('Invalid URL');
  }

  const request = net.request({
    method,
    url: requestUrl,
    headers,
    // each redirect is checked against the same rule as the requested URL
    redirect: 'manual',
  });

  request.setHeader('Accept', 'application/json');

  const responseData = await new Promise<TData>((resolve, reject) => {
    let data = '';
    let dataSize = 0;
    let statusCode: number | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    let isResolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const handleResolve = (value: TData) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(value);
      }
    };

    const handleReject = (error: Error) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(error);
      }
    };

    timeoutId = setTimeout(() => {
      handleReject(new Error(`Request timeout after ${timeout}ms`));
      request.abort();
    }, timeout);

    request.on('response', (response: IncomingMessage) => {
      statusCode = response.statusCode;

      if (statusCode && (statusCode < 200 || statusCode >= 300)) {
        handleReject(new Error(`HTTP error! status: ${statusCode}`));
        return;
      }

      response.on('data', (chunk: Buffer) => {
        dataSize += chunk.length;

        if (dataSize > maxSize) {
          const sizeInMB = (maxSize / (1024 * 1024)).toFixed(2);
          const receivedInMB = (dataSize / (1024 * 1024)).toFixed(2);
          handleReject(new Error(`Response size (${receivedInMB} MB) exceeded maximum allowed size of ${sizeInMB} MB`));
          request.abort();
          return;
        }

        data += chunk.toString('utf8');
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          handleResolve(parsedData);
        } catch (error) {
          handleReject(new Error('Failed to parse JSON response'));
        }
      });

      response.on('error', (error: Error) => {
        handleReject(error);
      });
    });

    request.on('error', (error: Error) => {
      handleReject(error);
    });

    request.on('abort', () => {
      handleReject(new Error('Request aborted'));
    });

    guardRedirects(request, requestUrl, (error) => {
      handleReject(error);
      request.abort();
    });

    request.end();
  });

  return responseData;
}
