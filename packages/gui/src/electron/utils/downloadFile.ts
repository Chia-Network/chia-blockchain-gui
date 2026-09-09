import { net } from 'electron';
import { promises as fs, createWriteStream, type WriteStream } from 'node:fs';

import debug from 'debug';

import type Headers from '../../@types/Headers';
import {
  DOWNLOAD_DEADLINE_ERROR_PREFIX,
  INACTIVITY_TIMEOUT_ERROR_PREFIX,
  MAX_FILE_SIZE_EXCEEDED_ERROR,
  isDownloadTimeoutError,
  isTransientDownloadError,
} from '../../util/downloadErrors';

import { DEFAULT_DOWNLOAD_MAX_DURATION } from './DownloadDeadline';
import fileExists from './fileExists';
import { toFetchableUrl } from './ipfsGateway';
import isValidURL, { isValidRequestURL } from './isValidURL';
import guardRedirects from './redirectPolicy';
import getRequestUserAgent from './requestUserAgent';

const log = debug('chia-gui:downloadFile');

class WriteStreamPromise {
  private stream: WriteStream;

  private writePromises: Promise<void>[] = [];

  constructor(
    private path: string,
    overrideFile = false,
  ) {
    this.stream = createWriteStream(path, {
      flags: overrideFile ? 'w' : 'wx', // w - override if exists, wx - fail if exists
    });
  }

  write(chunk: Buffer) {
    const promise = new Promise<void>((resolve, reject) => {
      this.stream.write(chunk, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    this.writePromises.push(promise);

    return promise;
  }

  async close() {
    try {
      await Promise.all(this.writePromises);
    } catch (error) {
      log('Error while writing to stream', error);
    }

    return new Promise<void>((resolve, reject) => {
      this.stream.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  on(event: string, listener: (...args: any[]) => void) {
    return this.stream.on(event, listener);
  }
}

// The error classification lives in util/downloadErrors so the renderer's
// gallery classifier reads persisted failures the same way the main process
// does; re-exported here for the main-process callers that always imported it
// from this module.
export { MAX_FILE_SIZE_EXCEEDED_ERROR, isDownloadTimeoutError, isTransientDownloadError };

// The absolute cap on one transfer unless the caller sets its own. Sized for
// videos on slow hosts; the inactivity timeout alone would let a host that
// trickles bytes hold a download slot forever.
export { DEFAULT_DOWNLOAD_MAX_DURATION };

// The default per-file cap, and the most any caller can ask for. A request
// for "no limit" (any value at or below zero, the form the size-limit
// override sends) gets the ceiling: a limit that is never enforced would let
// a minter-controlled host fill the disk for the length of the deadline.
export const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;
export const MAX_FILE_SIZE_CEILING = 2 * 1024 * 1024 * 1024;
export const DEFAULT_INACTIVITY_TIMEOUT = 30_000;

export function normalizeMaxSize(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_MAX_FILE_SIZE;
  }
  if (value <= 0 || value > MAX_FILE_SIZE_CEILING) {
    return MAX_FILE_SIZE_CEILING;
  }
  return Math.floor(value);
}

// The inactivity timeout is clamped the way the transfer deadline is: a
// value setTimeout cannot represent fires at once, and a non-number would be
// treated the same, so both fall back to the default instead.
export function normalizeTimeout(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_INACTIVITY_TIMEOUT;
  }
  return Math.max(1, Math.min(Math.floor(value), DEFAULT_DOWNLOAD_MAX_DURATION));
}

type DownloadFileOptions = {
  timeout?: number;
  maxDuration?: number; // absolute cap on the whole transfer
  signal?: AbortSignal;
  maxSize?: number; // see normalizeMaxSize: values <= 0 mean the ceiling
  onProgress?: (progress: number, size: number, downloadedSize: number) => void;
  overrideFile?: boolean;
  // the gateway base an ipfs:// url is fetched through; defaults to the
  // current preference (see toFetchableUrl)
  gatewayBase?: string;
  // the URL to actually request instead of `url` — the caller keeps `url` as
  // its cache key while fetching the same content from elsewhere (an IPFS
  // gateway URL whose own host failed, refetched through the configured
  // gateway); must itself be an https URL or a plain-http one on this
  // machine, the forms the gateway setting accepts
  requestUrl?: string;
};

export default async function downloadFile(
  url: string,
  localPath: string,
  {
    timeout: requestedTimeout,
    maxDuration = DEFAULT_DOWNLOAD_MAX_DURATION,
    signal,
    maxSize: requestedMaxSize,
    onProgress,
    overrideFile = false,
    gatewayBase,
    requestUrl,
  }: DownloadFileOptions = {},
): Promise<Headers> {
  if (!isValidURL(url)) {
    throw new Error('Invalid URL');
  }

  const maxSize = normalizeMaxSize(requestedMaxSize);
  const timeout = normalizeTimeout(requestedTimeout);

  // A queued download can be aborted (invalidation, cache directory change)
  // before the concurrency limiter starts it. Without this check the transfer
  // would still run, hold a download slot, and could settle the URL with a
  // permanent timeout error. The error matches the mid-flight abort message so
  // the cache treats it as retryable.
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }

  // ipfs:// URIs are fetched through an HTTPS gateway when the user has
  // enabled it — Electron's net stack cannot request the ipfs scheme, and
  // with the option off toFetchableUrl refuses the fetch outright. Only
  // this outgoing request uses the translated URL; callers keep the original
  // URI as the cache key. The translated URL is what actually leaves the
  // machine, so it is the string that gets validated.
  const fetchUrl = toFetchableUrl(requestUrl ?? url, gatewayBase);
  if (!isValidRequestURL(fetchUrl)) {
    throw new Error('Invalid URL');
  }

  const tempFilePath = `${localPath}.tmp`;
  // Redirects are followed one at a time, each checked against the same rule
  // as the requested URL (see redirectPolicy), so a host cannot redirect the
  // main process to a plain-http, loopback or private address.
  const request = net.request({ url: fetchUrl, redirect: 'manual' });
  request.setHeader('User-Agent', getRequestUserAgent());
  const outputStream = new WriteStreamPromise(tempFilePath, overrideFile);

  // set when we abort the request ourselves, so abort events can be reported
  // with the real reason instead of a generic aborted error
  let abortError: Error | undefined;

  function abortRequest() {
    request.abort();
  }

  // Timeouts must not report the generic aborted error: the cache retries
  // aborted downloads on every access, so a stalled host would be retried
  // (and stall again) forever instead of settling as a failed download.
  function abortWithError(error: Error) {
    abortError = error;
    request.abort();
  }

  guardRedirects(request, fetchUrl, abortWithError);

  let timeoutId: NodeJS.Timeout | null = null;

  // the timeout is an inactivity timeout - it is reset every time data
  // arrives, so slow hosts serving large files (videos) are not cut off mid
  // transfer while a stalled connection still fails fast
  function resetTimeout() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(
      () => abortWithError(new Error(`${INACTIVITY_TIMEOUT_ERROR_PREFIX} ${timeout}ms of inactivity`)),
      timeout,
    );
  }

  // absolute deadline for the whole transfer — the inactivity timeout alone
  // would let a host trickling bytes hold a download slot forever
  const maxDurationTimeoutId = setTimeout(
    () => abortWithError(new Error(`${DOWNLOAD_DEADLINE_ERROR_PREFIX} ${maxDuration}ms download deadline`)),
    maxDuration,
  );

  return new Promise<Headers>((resolve, reject) => {
    let downloadedSize = 0;

    let headers: Headers;
    let promiseFulfilled = false;

    async function resolvePromise(succeeded: boolean, error?: Error) {
      try {
        if (promiseFulfilled) {
          log('Promise already fulfilled', url);
          return;
        }

        promiseFulfilled = true;

        // cleanup listeners
        if (signal) {
          signal.removeEventListener('abort', abortRequest);
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        clearTimeout(maxDurationTimeoutId);

        await outputStream.close();

        // resolve promise
        if (succeeded) {
          log('Download succeeded', url);

          // rename temp file to local path
          if (!overrideFile) {
            const isFileExists = await fileExists(localPath);
            if (isFileExists) {
              throw new Error('File already exists');
            }
          }

          await fs.rename(tempFilePath, localPath);
          resolve(headers);
          return;
        }

        throw error ?? new Error('Unknown error');
      } catch (e) {
        log('Download failed', url, (e as Error)?.message);
        // The temp file may never have been created (the stream failed to
        // open) or may already be gone. Cleanup must not decide whether the
        // promise settles: this runs from fire-and-forget event handlers, so a
        // throw here would leave the caller — and its download slot — waiting
        // forever.
        await fs.unlink(tempFilePath).catch(() => {});
        reject(e);
      }
    }

    request.on('response', (response) => {
      const { statusCode } = response;
      if (statusCode < 200 || statusCode >= 300) {
        resolvePromise(false, new Error(`HTTP error: ${response.statusCode}`));
        request.abort();
        return;
      }

      headers = response.headers;

      // try to cancel request if file size is too large and content-length header is available, otherwise abort request during download
      const contentLengthHeader = response.headers['content-length'];
      const contentLength = Array.isArray(contentLengthHeader) ? contentLengthHeader[0] : contentLengthHeader;

      let fileSize: number | undefined;
      if (contentLength) {
        const size = Number.parseInt(contentLength, 10);
        if (!Number.isNaN(size)) {
          fileSize = size;
          if (maxSize > 0 && size > maxSize) {
            abortError = new Error(MAX_FILE_SIZE_EXCEEDED_ERROR);
            request.abort();
            return;
          }
        }
      }

      response.on('data', (chunk) => {
        downloadedSize += chunk.byteLength;
        resetTimeout();

        if (maxSize > 0 && downloadedSize > maxSize) {
          abortError = new Error(MAX_FILE_SIZE_EXCEEDED_ERROR);
          request.abort();
          return;
        }

        outputStream.write(chunk).catch((error) => {
          resolvePromise(false, error);
        });

        // send progress event only when we know the file size
        if (onProgress && fileSize !== undefined && fileSize > 0) {
          const progress = Math.min((downloadedSize / fileSize) * 100, 100);
          onProgress(progress, fileSize, downloadedSize);
        }
      });

      response.on('error', (error = new Error('Unknown response error')) => {
        resolvePromise(false, error);
      });

      response.on('aborted', () => {
        resolvePromise(false, abortError ?? new Error('Response aborted'));
      });

      response.on('end', () => {
        resolvePromise(true);
      });
    });

    request.on('abort', () => {
      resolvePromise(false, abortError ?? new Error('Request aborted'));
    });

    request.on('error', (error = new Error('Unknown request error')) => {
      resolvePromise(false, error);
    });

    // A write stream that cannot open its file (missing cache directory, no
    // permission, too many open files) reports it as an 'error' event; with no
    // listener that is an uncaught exception in the main process.
    outputStream.on('error', (error: Error = new Error('Unknown write error')) => {
      resolvePromise(false, error);
      request.abort();
    });

    if (signal) {
      signal.addEventListener('abort', abortRequest);
    }

    resetTimeout();

    request.end();
  });
}
