import { net, type IncomingMessage } from 'electron';

import type Headers from '../../@types/Headers';

import { toFetchableUrl } from './ipfsGateway';
import isValidURL, { isValidRequestURL } from './isValidURL';
import guardRedirects from './redirectPolicy';

const DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export type FetchBufferResult = {
  data: Buffer;
  headers: Headers;
};

/** Carries the response headers so callers can decide how to degrade when a
 * response is too large to buffer — e.g. fall back to a direct URL for a
 * verified image content type. */
export class MaxSizeExceededError extends Error {
  readonly headers: Headers;

  constructor(headers: Headers) {
    super('Response exceeded maximum allowed size');
    this.name = 'MaxSizeExceededError';
    this.headers = headers;
  }
}

export default async function fetchBuffer(
  url: string,
  options?: {
    headers?: Record<string, string>;
    timeout?: number;
    maxSize?: number;
  },
): Promise<FetchBufferResult> {
  const { headers = {}, timeout = DEFAULT_TIMEOUT, maxSize = DEFAULT_MAX_SIZE } = options ?? {};

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
    method: 'GET',
    url: requestUrl,
    headers,
    // each redirect is checked against the same rule as the requested URL
    redirect: 'manual',
  });

  return new Promise<FetchBufferResult>((resolve, reject) => {
    let settled = false;
    let timeoutId: NodeJS.Timeout | undefined;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const resolveOnce = (result: FetchBufferResult) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(result);
      }
    };

    const rejectOnce = (error: Error) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    };

    const abortWith = (error: Error) => {
      rejectOnce(error);
      request.abort();
    };

    timeoutId = setTimeout(() => {
      abortWith(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    request.on('response', (response: IncomingMessage) => {
      const { statusCode } = response;
      if (statusCode < 200 || statusCode >= 300) {
        abortWith(new Error(`HTTP error! status: ${statusCode}`));
        return;
      }

      const contentLengthHeader = response.headers['content-length'];
      const contentLength = Array.isArray(contentLengthHeader) ? contentLengthHeader[0] : contentLengthHeader;
      if (maxSize > 0 && contentLength) {
        const parsedContentLength = Number.parseInt(contentLength, 10);
        if (!Number.isNaN(parsedContentLength) && parsedContentLength > maxSize) {
          abortWith(new MaxSizeExceededError(response.headers as Headers));
          return;
        }
      }

      const chunks: Buffer[] = [];
      let dataSize = 0;

      response.on('data', (chunk: Buffer) => {
        if (settled) {
          return;
        }

        dataSize += chunk.byteLength;
        if (maxSize > 0 && dataSize > maxSize) {
          abortWith(new MaxSizeExceededError(response.headers as Headers));
          return;
        }

        chunks.push(chunk);
      });

      response.on('end', () => {
        resolveOnce({
          data: Buffer.concat(chunks),
          headers: response.headers as Headers,
        });
      });

      response.on('aborted', () => {
        rejectOnce(new Error('Response aborted'));
      });

      response.on('error', (error: Error) => {
        rejectOnce(error);
      });
    });

    request.on('error', (error: Error) => {
      rejectOnce(error);
    });

    request.on('abort', () => {
      rejectOnce(new Error('Request aborted'));
    });

    guardRedirects(request, requestUrl, (error) => {
      rejectOnce(error);
      request.abort();
    });

    request.end();
  });
}
