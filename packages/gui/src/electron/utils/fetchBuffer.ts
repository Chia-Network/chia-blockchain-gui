import { net, type IncomingMessage } from 'electron';

import type Headers from '../../@types/Headers';

import isValidURL from './isValidURL';

const DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export type FetchBufferResult = {
  data: Buffer;
  headers: Headers;
};

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

  const request = net.request({
    method: 'GET',
    url,
    headers,
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
          abortWith(new Error('Response exceeded maximum allowed size'));
          return;
        }
      }

      const chunks: Uint8Array[] = [];
      let dataSize = 0;

      response.on('data', (chunk: Buffer) => {
        if (settled) {
          return;
        }

        const buffer = Uint8Array.from(chunk);
        dataSize += buffer.byteLength;
        if (maxSize > 0 && dataSize > maxSize) {
          abortWith(new Error('Response exceeded maximum allowed size'));
          return;
        }

        chunks.push(buffer);
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

    request.end();
  });
}
