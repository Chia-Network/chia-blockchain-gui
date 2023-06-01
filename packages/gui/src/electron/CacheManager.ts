import crypto from 'crypto';
import { protocol, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

import debug from 'debug';
import isURL from 'validator/lib/isURL';

import type CacheInfo from '../@types/CacheInfo';
import type CacheInfoBase from '../@types/CacheInfoBase';
import type Headers from '../@types/Headers';
import CacheState from '../constants/CacheState';
import limit from '../util/limit';
import downloadFile from './utils/downloadFile';
import ensureDirectoryExists from './utils/ensureDirectoryExists';
import getChecksum from './utils/getChecksum';
import handleWithCustomErrors from './utils/handleWithCustomErrors';
import sanitizeNumber from './utils/sanitizeNumber';

const log = debug('chia-gui:CacheManager');

async function safeUnlink(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore
  }
}

const INFO_SUFFIX = '-info';
const FILE_SUFFIX = '-chiacache';
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB
const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB

const SUFFIXES = [FILE_SUFFIX, `${FILE_SUFFIX}${INFO_SUFFIX}`];

function isChiaCacheFile(filePath: string) {
  return SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

function isChiaCacheInfoFile(filePath: string) {
  return isChiaCacheFile(filePath) && filePath.endsWith(INFO_SUFFIX);
}

function getInfoFilePath(filePath: string) {
  return `${filePath}${INFO_SUFFIX}`;
}

function removePrefix(str: string, variable: string): string {
  const prefix = `${variable}://`;
  if (str.startsWith(prefix)) {
    return str.replace(prefix, '');
  }

  return str;
}

export default class CacheManager extends EventEmitter {
  #cacheDirectory: string = './cache';

  #maxCacheSize: number = 0;

  #protocolScheme: string = 'cache';

  #downloadLimit;

  private ongoingRequests: Map<
    string,
    {
      promise: Promise<CacheInfo>;
      abort: () => void;
    }
  > = new Map();

  constructor(
    options: {
      cacheDirectory?: string;
      maxCacheSize?: number | string;
      protocolScheme?: string;
      concurrency?: number;
    } = {}
  ) {
    super();

    const {
      cacheDirectory = './cache',
      maxCacheSize = MAX_TOTAL_SIZE,
      protocolScheme = 'cache',
      concurrency = 10,
    } = options;

    this.cacheDirectory = cacheDirectory;
    this.maxCacheSize = maxCacheSize;
    this.#protocolScheme = protocolScheme;
    this.#downloadLimit = limit(concurrency);

    this.setMaxListeners(50);

    this.prepareElectron();
  }

  private prepareElectron() {
    this.prepareIPC();
  }

  private prepareProtocol() {
    protocol.registerFileProtocol(this.protocolScheme, async (request: any, callback: (obj: any) => void) => {
      const fileName = removePrefix(request.url, this.protocolScheme);
      const filePath = path.join(this.cacheDirectory, fileName);

      try {
        const infoFilePath = getInfoFilePath(filePath);
        const cacheInfo = await this.getCacheInfo(infoFilePath, request.url);

        if (cacheInfo.state === CacheState.CACHED) {
          const { headers } = cacheInfo;

          callback({
            path: filePath,
            mimeType: headers['content-type'] ?? 'text/html',
          });

          return;
        }

        throw new Error('Not cached');
      } catch (error) {
        callback({
          path: filePath,
        });
      }
    });
  }

  private prepareIPC() {
    handleWithCustomErrors('cache:getCacheSize', () => this.getCacheSize());
    handleWithCustomErrors('cache:clearCache', () => this.clearCache());
    handleWithCustomErrors('cache:setCacheDirectory', (_event, newDirectory: string) =>
      this.setCacheDirectory(newDirectory)
    );
    handleWithCustomErrors('cache:setMaxCacheSize', (_event, newSize: number) => this.setMaxCacheSize(newSize));
    handleWithCustomErrors(
      'cache:getContent',
      (_event, url: string, options?: { maxSize?: number; timeout?: number }) => this.getContent(url, options)
    );
    handleWithCustomErrors(
      'cache:getHeaders',
      (_event, url: string, options?: { maxSize?: number; timeout?: number }) => this.getHeaders(url, options)
    );
    handleWithCustomErrors(
      'cache:getChecksum',
      (_event, url: string, options?: { maxSize?: number; timeout?: number }) => this.getChecksum(url, options)
    );
    handleWithCustomErrors('cache:getURI', (_event, url: string, options?: { maxSize?: number; timeout?: number }) =>
      this.getURI(url, options)
    );
    handleWithCustomErrors('cache:invalidate', (_event, url: string) => this.invalidate(url));

    handleWithCustomErrors('cache:getCacheDirectory', () => this.cacheDirectory);
    handleWithCustomErrors('cache:getMaxCacheSize', () => this.maxCacheSize);
  }

  public bindEvents(window: BrowserWindow) {
    function onCacheDirectoryChanged(newDirectory: string) {
      window.webContents.send('cache:cacheDirectoryChanged', newDirectory);
    }

    function onMaxCacheSizeChanged(newSize: number) {
      window.webContents.send('cache:maxCacheSizeChanged', newSize);
    }

    const onSizeChanged = async () => {
      window.webContents.send('cache:sizeChanged', await this.getCacheSize());
    };

    this.on('cacheDirectoryChanged', onCacheDirectoryChanged);
    this.on('maxCacheSizeChanged', onMaxCacheSizeChanged);
    this.on('sizeChanged', onSizeChanged);

    const unbind = () => {
      this.off('cacheDirectoryChanged', onCacheDirectoryChanged);
      this.off('maxCacheSizeChanged', onMaxCacheSizeChanged);
      this.off('sizeChanged', onSizeChanged);
    };

    window.on('close', () => {
      unbind();
    });

    return unbind;
  }

  async init() {
    this.prepareProtocol();
    await ensureDirectoryExists(this.cacheDirectory);
  }

  public get protocolScheme(): string {
    return this.#protocolScheme;
  }

  public get maxCacheSize(): number {
    return this.#maxCacheSize;
  }

  public set maxCacheSize(newSize: number | string) {
    const value = sanitizeNumber(newSize);
    if (value < 0) {
      throw new Error('Cache size cannot be negative');
    }

    this.#maxCacheSize = value;

    this.emit('maxCacheSizeChanged', this.#maxCacheSize);
  }

  public get cacheDirectory(): string {
    return this.#cacheDirectory;
  }

  public set cacheDirectory(cacheDirectory: string) {
    this.#cacheDirectory = cacheDirectory;

    this.emit('cacheDirectoryChanged', this.#cacheDirectory);
  }

  private getCacheFilePath(url: string) {
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const fileName = `${urlHash}${FILE_SUFFIX}`;
    return path.join(this.cacheDirectory, fileName);
  }

  private getCacheInfoFilePath(url: string) {
    const filePath = this.getCacheFilePath(url);
    return getInfoFilePath(filePath);
  }

  private async getCacheInfo(filePath: string, url: string): Promise<CacheInfo> {
    try {
      const infoString = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(infoString) as CacheInfo;
    } catch (error) {
      const currentError = (error as Error) ?? new Error('Unknown error');
      if ((currentError as { code?: string }).code === 'ENOENT') {
        return {
          url,
          state: CacheState.NOT_CACHED,
          timestamp: Date.now(),
        };
      }

      return {
        url,
        state: CacheState.ERROR,
        error: currentError.message,
        timestamp: Date.now(),
      };
    }
  }

  private async getCacheInfoByURL(url: string): Promise<CacheInfo> {
    const filePath = this.getCacheInfoFilePath(url);

    return this.getCacheInfo(filePath, url);
  }

  private async setCacheInfo(url: string, infoBase: CacheInfoBase) {
    const infoFilePath = this.getCacheInfoFilePath(url);

    const cacheInfo: CacheInfo = {
      ...infoBase,
      url,
      timestamp: Date.now(),
    };

    await fs.writeFile(infoFilePath, JSON.stringify(cacheInfo), 'utf-8');

    return cacheInfo;
  }

  abort(url: string) {
    const ongoingRequest = this.ongoingRequests.get(url);
    if (ongoingRequest) {
      ongoingRequest.abort();
    }
  }

  async fetchRemoteContent(
    url: string,
    options: {
      maxSize?: number;
      timeout?: number;
    } = {}
  ): Promise<CacheInfo> {
    const { maxSize = MAX_FILE_SIZE, timeout = 30_000 } = options;

    const ongoingRequest = this.ongoingRequests.get(url);
    if (ongoingRequest) {
      log('Request already ongoing', url);
      return ongoingRequest.promise;
    }

    const abortController = new AbortController();

    const process = async (): Promise<CacheInfo> => {
      try {
        // From isValidURL.ts
        // isURL returns false for URLs with unencoded spaces. We can't use
        // encodeURI if the URL is already encoded, so we attempt to decode
        // the URL first and then encode it if it wasn't already encoded.

        const normalizedURL = decodeURI(url) === url ? encodeURI(url) : url;

        if (!isURL(normalizedURL)) {
          throw new Error(`Invalid URL: ${normalizedURL}`);
        }

        const cacheInfo = await this.getCacheInfoByURL(url);
        if (cacheInfo.state === CacheState.CACHED) {
          log('Url already downloaded', url);
          return cacheInfo;
        }

        if (cacheInfo.state === CacheState.ERROR) {
          log(`Url already downloaded with error: ${cacheInfo.error}`, url);
          if (!['Response aborted', 'Request aborted'].includes(cacheInfo.error)) {
            return cacheInfo;
          }

          log('Retrying download', url);
        }

        const limitedRemoteFileDownload = async (): Promise<CacheInfo> => {
          const cacheFilePath = this.getCacheFilePath(url);

          log('Starting download', url);
          const headers = await downloadFile(url, cacheFilePath, {
            timeout,
            maxSize,
            signal: abortController.signal,
          });

          log('Download finished', url);

          // compute checksum
          const checksum = await getChecksum(cacheFilePath);

          log('Checksum computed', url);

          // save headers to a local JSON file
          const updatedCacheInfo = this.setCacheInfo(url, {
            state: CacheState.CACHED,
            headers,
            checksum,
          });

          log('Cache info saved', url);
          // remove old files if the cache is full
          const currentCacheSize = await this.getCacheSize();
          const stats = await fs.stat(cacheFilePath);
          if (this.maxCacheSize && currentCacheSize + stats.size > this.maxCacheSize) {
            const spaceNeeded = currentCacheSize + stats.size - this.maxCacheSize;
            await this.removeOldestFiles(spaceNeeded);
          }
          // todo just add size and save it locally
          this.emit('sizeChanged');

          return updatedCacheInfo;
        };

        return await this.#downloadLimit<CacheInfo>(() => limitedRemoteFileDownload());
      } catch (error) {
        const currentError = (error as Error) ?? new Error('Unknown fetchRemoteContent error');

        return await this.setCacheInfo(url, {
          state: CacheState.ERROR,
          error: currentError.message,
        });
      } finally {
        this.ongoingRequests.delete(url);
      }
    };

    const promise = process();

    this.ongoingRequests.set(url, {
      abort: () => abortController.abort(),
      promise,
    });

    return promise;
  }

  async getHeaders(
    url: string,
    options?: {
      maxSize?: number;
      timeout?: number;
    }
  ): Promise<Headers> {
    const cacheInfo = await this.fetchRemoteContent(url, options);

    if (cacheInfo.state === CacheState.ERROR) {
      throw new Error(cacheInfo.error);
    }

    if (cacheInfo.state === CacheState.NOT_CACHED) {
      throw new Error('Url is not cached');
    }

    if (cacheInfo.state === CacheState.CACHED) {
      return cacheInfo.headers;
    }

    throw new Error('Unknown cache state');
  }

  async getContent(
    url: string,
    options?: {
      maxSize?: number;
      timeout?: number;
    }
  ): Promise<Buffer> {
    const cacheInfo = await this.fetchRemoteContent(url, options);

    if (cacheInfo.state === CacheState.ERROR) {
      throw new Error(cacheInfo.error);
    }

    if (cacheInfo.state === CacheState.NOT_CACHED) {
      throw new Error('Url is not cached');
    }

    if (cacheInfo.state === CacheState.CACHED) {
      const filePath = this.getCacheFilePath(url);
      return fs.readFile(filePath);
    }

    throw new Error('Unknown cache state');
  }

  async getChecksum(
    url: string,
    options?: {
      maxSize?: number;
      timeout?: number;
    }
  ): Promise<string> {
    const cacheInfo = await this.fetchRemoteContent(url, options);

    if (cacheInfo.state === CacheState.ERROR) {
      throw new Error(cacheInfo.error);
    }

    if (cacheInfo.state === CacheState.NOT_CACHED) {
      throw new Error('Url is not cached');
    }

    if (cacheInfo.state === CacheState.CACHED) {
      return cacheInfo.checksum;
    }

    throw new Error('Unknown cache state');
  }

  async getURI(
    url: string,
    options?: {
      maxSize?: number;
      timeout?: number;
    }
  ) {
    const cacheInfo = await this.fetchRemoteContent(url, options);

    if (cacheInfo.state === CacheState.ERROR) {
      throw new Error(cacheInfo.error);
    }

    if (cacheInfo.state === CacheState.NOT_CACHED) {
      throw new Error('Url is not cached');
    }

    if (cacheInfo.state === CacheState.CACHED) {
      const filePath = this.getCacheFilePath(url);
      return `${this.protocolScheme}://${path.basename(filePath)}`;
    }

    throw new Error('Unknown cache state');
  }

  async clearCache() {
    // cancel all ongoing requests
    for (const ongoingRequest of this.ongoingRequests.values()) {
      ongoingRequest.abort();
    }
    this.ongoingRequests.clear();

    const files = await fs.readdir(this.cacheDirectory);
    const unlinkPromises = files.map(async (file) => {
      const hasSuffix = SUFFIXES.some((suffix) => file.endsWith(suffix));
      if (hasSuffix) {
        const filePath = path.join(this.cacheDirectory, file);
        await safeUnlink(filePath);
      }
    });

    await Promise.all(unlinkPromises);

    this.emit('sizeChanged');
  }

  async setCacheDirectory(newDirectory: string) {
    await ensureDirectoryExists(newDirectory);

    // move the files from the current cache directory to the new directory
    const files = await fs.readdir(this.cacheDirectory);
    const movePromises = files.map(async (file) => {
      if (!isChiaCacheFile(file)) {
        return;
      }

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
      .filter((file) => isChiaCacheFile(file) && !isChiaCacheInfoFile(file))
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
        await safeUnlink(filePath);
        await safeUnlink(getInfoFilePath(filePath));
      })
    );

    this.emit('sizeChanged');
  }

  async invalidate(url: string) {
    // cancel the ongoing request
    const ongoingRequest = this.ongoingRequests.get(url);
    if (ongoingRequest) {
      ongoingRequest.abort();
    }

    // prepare invalidation
    const filePath = this.getCacheFilePath(url);

    // remove the file
    await safeUnlink(filePath);
    await safeUnlink(getInfoFilePath(filePath));

    this.emit('sizeChanged');
  }

  async setMaxCacheSize(maxCacheSize: number | string) {
    this.maxCacheSize = sanitizeNumber(maxCacheSize);
    await this.removeOldestFiles(this.maxCacheSize);
  }

  async getCacheSize() {
    const files = await fs.readdir(this.cacheDirectory);
    const filePaths = files
      .filter((filename) => isChiaCacheFile(filename))
      .map((filename) => path.join(this.cacheDirectory, filename));

    // Get the file sizes and calculate the total size
    const fileSizes = await Promise.all(filePaths.map(async (filePath) => (await fs.stat(filePath)).size));
    const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);

    return totalSize;
  }
}
