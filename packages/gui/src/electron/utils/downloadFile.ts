import { net } from 'electron';
import { promises as fs, createWriteStream, type WriteStream } from 'fs';

import debug from 'debug';

import type Headers from '../../@types/Headers';
import fileExists from './fileExists';

const log = debug('chia-gui:downloadFile');

class WriteStreamPromise {
  private stream: WriteStream;

  private writePromises: Promise<void>[] = [];

  constructor(private path: string) {
    this.stream = createWriteStream(path, {
      flags: 'w', // override if exists
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

  on(event: string, listener: () => void) {
    return this.stream.on(event, listener);
  }
}

type DownloadFileOptions = {
  timeout?: number;
  signal?: AbortSignal;
  maxSize?: number;
  onProgress?: (progress: number, size: number, downloadedSize: number) => void;
  overrideFile?: boolean;
};

export default async function downloadFile(
  url: string,
  localPath: string,
  {
    timeout = 30_000,
    signal,
    maxSize = 100 * 1024 * 1024,
    onProgress,
    overrideFile = false,
  }: DownloadFileOptions = {},
): Promise<Headers> {
  if (!overrideFile) {
    const isFileExists = await fileExists(localPath);
    if (isFileExists) {
      throw new Error('File already exists');
    }
  }

  const tempFilePath = `${localPath}.tmp`;
  const request = net.request(url);
  const outputStream = new WriteStreamPromise(tempFilePath);

  function abortRequest() {
    request.abort();
  }

  let timeoutId: NodeJS.Timeout | null = null;

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

        await outputStream.close();

        // resolve promise
        if (succeeded) {
          log('Download succeeded', url);
          // rename temp file to local path
          await fs.rename(tempFilePath, localPath);
          resolve(headers);
          return;
        }

        throw error ?? new Error('Unknown error');
      } catch (e) {
        log('Download failed', url, (e as Error)?.message);
        await fs.unlink(tempFilePath);
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
          if (size > maxSize) {
            request.abort();
            return;
          }
        }
      }

      response.on('data', (chunk) => {
        downloadedSize += chunk.byteLength;

        if (downloadedSize > maxSize) {
          request.abort();
          return;
        }

        outputStream.write(chunk).catch((error) => {
          resolvePromise(false, error);
        });

        // send progress event only when we know the file size
        if (onProgress && fileSize !== undefined && fileSize > 0) {
          const progress = Math.max((downloadedSize / fileSize) * 100, 100);
          onProgress(progress, fileSize, downloadedSize);
        }
      });

      response.on('error', (error = new Error('Unknown response error')) => {
        resolvePromise(false, error);
      });

      response.on('aborted', () => {
        resolvePromise(false, new Error('Response aborted'));
      });

      response.on('end', () => {
        resolvePromise(true);
      });
    });

    request.on('abort', () => {
      resolvePromise(false, new Error('Request aborted'));
    });

    request.on('error', (error = new Error('Unknown request error')) => {
      resolvePromise(false, error);
    });

    if (signal) {
      signal.addEventListener('abort', abortRequest);
    }

    timeoutId = setTimeout(abortRequest, timeout);

    request.end();
  });
}
