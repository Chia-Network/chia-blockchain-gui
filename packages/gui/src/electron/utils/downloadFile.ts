import { net } from 'electron';
import { promises as fs, createWriteStream, type WriteStream } from 'fs';

import debug from 'debug';

import type Headers from '../../@types/Headers';

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
    await Promise.all(this.writePromises);

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

export default async function downloadFile(
  url: string,
  localPath: string,
  {
    timeout = 30_000,
    signal,
    maxSize = 100 * 1024 * 1024,
    onProgress,
  }: {
    timeout?: number;
    signal?: AbortSignal;
    maxSize?: number;
    onProgress?: (progress: number, size: number, downloadedSize: number) => void;
  }
): Promise<Headers> {
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
      const size = headers['content-length'] ? parseInt(headers['content-length'], 10) || 0 : 0;
      if (size > maxSize) {
        request.abort();
        return;
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

        const progress = size ? (downloadedSize / size) * 100 : 0;
        onProgress?.(progress, size, downloadedSize);
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
