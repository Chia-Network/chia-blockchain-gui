import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import isURL from 'validator/lib/isURL';

import canReadFile from './utils/canReadFile';
import downloadFile from './utils/downloadFile';
import ensureDirectoryExists from './utils/ensureDirectoryExists';
import getChecksum from './utils/getChecksum';
import getRemoteFileSize from './utils/getRemoteFileSize';
import sanitizeNumber from './utils/sanitizeNumber';

type CachedFile = {
  headers: any;
  content: Buffer;
  checksum: string;
};

const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB
const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB

function getHeadersFilePath(filePath: string) {
  return `${filePath}.json`;
}

export default class CacheManager {
  readonly cacheDirectory: string;

  readonly maxTotalSize: number;

  private ongoingRequests: Map<string, Promise<CachedFile>> = new Map();

  constructor(cacheDirectory: string = './cache', maxTotalSize: number | string = MAX_TOTAL_SIZE) {
    this.cacheDirectory = cacheDirectory;
    this.maxTotalSize = sanitizeNumber(maxTotalSize);

    ensureDirectoryExists(this.cacheDirectory);
  }

  private getCacheFilePath(url: string) {
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    return path.join(this.cacheDirectory, urlHash);
  }

  private async readCachedFile(filePath: string) {
    const headersFilePath = `${filePath}.json`;

    const content = await fs.readFile(filePath);
    const headersString = await fs.readFile(headersFilePath, 'utf-8');
    const headers = JSON.parse(headersString);

    return { headers, content, checksum: headers.checksum };
  }

  async fetchData(url: string, options: { timeout?: number; maxSize?: number } = {}): Promise<CachedFile> {
    const filePath = this.getCacheFilePath(url);
    const { timeout = 30_000, maxSize = MAX_FILE_SIZE } = options;
    const remoteFileSize = await getRemoteFileSize(url);
    if (maxSize && remoteFileSize > maxSize) {
      throw new Error(`File size exceeds maximum limit of ${maxSize} bytes`);
    }

    const headers = await downloadFile(url, filePath, {
      timeout,
      maxSize,
    });

    // remove old files if the cache is full
    const currentCacheSize = await this.getCacheSize();
    const stats = await fs.stat(filePath);
    if (this.maxTotalSize && currentCacheSize + stats.size > this.maxTotalSize) {
      const spaceNeeded = currentCacheSize + stats.size - this.maxTotalSize;
      await this.removeOldestFiles(spaceNeeded);
    }

    // compute checksum
    const checksum = await getChecksum(filePath);

    const updatedHeaders = {
      ...headers,
      checksum,
    };

    // save headers to a local JSON file
    const headersFilePath = getHeadersFilePath(filePath);
    await fs.writeFile(headersFilePath, JSON.stringify(updatedHeaders, null, 2));

    return this.readCachedFile(filePath);
  }

  async get(
    url: string,
    options: {
      maxSize?: number;
      timeout?: number;
    } = {}
  ): Promise<CachedFile> {
    const { maxSize = MAX_FILE_SIZE, timeout = 30_000 } = options;

    if (!isURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    const ongoingRequest = this.ongoingRequests.get(url);
    if (ongoingRequest) {
      return ongoingRequest;
    }

    const cacheFilePath = this.getCacheFilePath(url);

    if (await canReadFile(cacheFilePath)) {
      return this.readCachedFile(cacheFilePath);
    }

    const requestPromise = this.fetchData(url, {
      maxSize,
      timeout,
    });

    this.ongoingRequests.set(url, requestPromise);
    requestPromise.finally(() => this.ongoingRequests.delete(url));

    return requestPromise;
  }

  async clearCache() {
    const files = await fs.readdir(this.cacheDirectory);
    const unlinkPromises = files.map(async (file) => {
      const filePath = path.join(this.cacheDirectory, file);
      await fs.unlink(filePath);
    });

    await Promise.all(unlinkPromises);
  }

  async changeCacheDirectory(newDirectory: string) {
    await ensureDirectoryExists(newDirectory);

    // move the files from the current cache directory to the new directory
    const files = await fs.readdir(this.cacheDirectory);
    const movePromises = files.map(async (file) => {
      const oldFilePath = path.join(this.cacheDirectory, file);
      const newFilePath = path.join(newDirectory, file);

      const stat = await fs.lstat(oldFilePath);

      if (stat.isFile()) {
        await fs.rename(oldFilePath, newFilePath);
      }
    });

    await Promise.all(movePromises);

    this.cacheDirectory = newDirectory;
  }

  private async removeOldestFiles(targetSize: number): Promise<void> {
    const files = await fs.readdir(this.cacheDirectory);
    const filePaths = files
      .filter((file) => !file.endsWith('.json'))
      .map((file) => path.join(this.cacheDirectory, file));

    // get the file sizes
    const fileStats = await Promise.all(
      filePaths.map(async (filePath) => {
        const stats = await fs.stat(filePath);
        return {
          filePath,
          size: stats.size,
          mtime: stats.mtime,
        };
      })
    );

    // sort the file paths based on their last modified time (oldest first)
    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    // remove files until the total size is below the new max total size
    let totalSize = fileStats.reduce((sum, { size }) => sum + size, 0);
    const filesToRemove = fileStats.filter(({ size }) => {
      if (totalSize > targetSize) {
        totalSize -= size;
        return true;
      }
      return false;
    });

    await Promise.all(
      filesToRemove.map(async ({ filePath }) => {
        await fs.unlink(filePath);

        const headersFilePath = getHeadersFilePath(filePath);
        if (await canReadFile(headersFilePath)) {
          await fs.unlink(headersFilePath);
        }
      })
    );
  }

  async invalidate(url: string) {
    // prepare invalidation
    const filePath = this.getCacheFilePath(url);

    // remove the file
    await fs.unlink(filePath);
    const headersFilePath = getHeadersFilePath(filePath);
    if (await canReadFile(headersFilePath)) {
      await fs.unlink(headersFilePath);
    }
  }

  async setMaxTotalSize(newSize: number) {
    this.maxTotalSize = newSize;

    await this.removeOldestFiles(newSize);
  }

  async getCacheSize() {
    const files = await fs.readdir(this.cacheDirectory);
    const filePaths = files.map((file) => path.join(this.cacheDirectory, file));

    // Get the file sizes and calculate the total size
    const fileSizes = await Promise.all(filePaths.map(async (filePath) => (await fs.stat(filePath)).size));
    const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);

    return totalSize;
  }
}
