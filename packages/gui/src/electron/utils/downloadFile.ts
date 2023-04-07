import { net } from 'electron';
import fsBase from 'fs';
import fs from 'fs/promises';

const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB

export default function downloadFile(
  url: string,
  path: string,
  options: {
    timeout?: number;
    headers?: Object;
    maxSize?: number;
    onProgress?: (progress: number, size: number, downloadedSize: number) => void;
  } = {}
) {
  const { timeout, headers = {}, maxSize = MAX_FILE_SIZE, onProgress } = options;

  const writer = fsBase.createWriteStream(path);
  if (!writer) {
    throw new Error('Failed to create write stream');
  }

  const request = net.request({
    method: 'GET',
    url,
  });

  let timeoutId = timeout
    ? setTimeout(() => {
        request.abort();

        timeoutId = null;
      }, timeout)
    : null;

  const promise = new Promise<Record<string, string | string[]>>((resolve, reject) => {
    if (headers) {
      Object.entries(headers).forEach(([header, value]: [string, any]) => {
        request.setHeader(header, value);
      });
    }

    let downloadedSize = 0;

    request.on('response', (response) => {
      const fileSize = Number(response.headers['content-length'] || -1);

      response.on('data', (chunk) => {
        downloadedSize += chunk.byteLength;
        if (downloadedSize > maxSize) {
          request.abort();
          return;
        }

        writer.write(chunk);

        if (onProgress && fileSize >= 0) {
          onProgress(downloadedSize / fileSize, fileSize, downloadedSize);
        }
      });

      response.on('end', () => {
        resolve(response.headers);
      });

      writer.on('error', (error) => {
        reject(error);
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });

  promise
    .finally(() => {
      // close stream
      writer.end();

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    })
    .catch(async () => {
      // delete file if download failed
      await fs.unlink(path).catch(() => {
        // ignore error when deleting the file
      });
    });

  // provide ability to abort download
  (promise as any).abort = () => {
    request.abort();
  };

  return promise;
}
