import { BrowserWindow, dialog, type Protocol } from 'electron';
import { EventEmitter } from 'events';
import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import debug from 'debug';

import type CacheInfo from '../@types/CacheInfo';
import type CacheInfoBase from '../@types/CacheInfoBase';
import type Headers from '../@types/Headers';
import CacheState from '../constants/CacheState';
import limit from '../util/limit';

import CacheAPI from './constants/CacheAPI';
import downloadFile, { MAX_FILE_SIZE_EXCEEDED_ERROR, isDownloadTimeoutError } from './utils/downloadFile';
import ensureDirectoryExists from './utils/ensureDirectoryExists';
import getChecksum from './utils/getChecksum';
import ipcMainHandle from './utils/ipcMainHandle';
import { IpfsGatewayDisabledError } from './utils/ipfsGateway';
import isValidURL from './utils/isValidURL';
import sanitizeFilename from './utils/sanitizeFilename';
import sanitizeNumber from './utils/sanitizeNumber';

const log = debug('chia-gui:CacheManager');

export const CACHE_PROTOCOL = 'cache';

// A single-range `bytes=start-end` Range header, parsed against the file size.
// 'ignore' means the header is absent or uses a form we do not support
// (e.g. multiple ranges), in which case the full file is served with a 200.
type ParsedRange = { start: number; end: number } | 'invalid' | 'ignore';

function parseRangeHeader(rangeHeader: string | null, fileSize: number): ParsedRange {
  if (!rangeHeader) {
    return 'ignore';
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return 'ignore';
  }

  const [, startString, endString] = match;

  if (startString === '' && endString === '') {
    return 'invalid';
  }

  if (startString === '') {
    // suffix range: the last N bytes of the file
    const suffixLength = Number.parseInt(endString, 10);
    if (suffixLength === 0 || fileSize === 0) {
      return 'invalid';
    }

    return { start: Math.max(fileSize - suffixLength, 0), end: fileSize - 1 };
  }

  const start = Number.parseInt(startString, 10);
  if (start >= fileSize) {
    return 'invalid';
  }

  const end = endString === '' ? fileSize - 1 : Math.min(Number.parseInt(endString, 10), fileSize - 1);
  if (start > end) {
    return 'invalid';
  }

  return { start, end };
}

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

export default class CacheManager extends EventEmitter {
  #cacheDirectory: string = './cache';

  #maxCacheSize: number = 0;

  #downloadLimit;

  private ongoingRequests: Map<
    string,
    {
      promise: Promise<CacheInfo>;
      abort: () => void;
    }
  > = new Map();

  // URLs whose download timed out during this session. A persisted timeout is
  // retried once per session — the set keeps a stalled host from being retried
  // (and holding a download slot) on every access within the same session.
  private timedOutUrls: Set<string> = new Set();

  constructor(
    options: {
      cacheDirectory?: string;
      maxCacheSize?: number | string;
      concurrency?: number;
    } = {},
  ) {
    super();

    const { cacheDirectory = './cache', maxCacheSize = MAX_TOTAL_SIZE, concurrency = 10 } = options;

    this.cacheDirectory = cacheDirectory;
    this.maxCacheSize = maxCacheSize;
    // LIFO: downloads for what the user is currently viewing (an offer
    // preview, a just-opened detail page) are requested last and must not
    // wait behind a long gallery-wide rebuild of earlier requests.
    this.#downloadLimit = limit(concurrency, { lifo: true });

    this.setMaxListeners(50);

    this.prepareElectron();
  }

  private prepareElectron() {
    this.prepareIPC();
  }

  prepareProtocol(protocol: Protocol) {
    protocol.handle(CACHE_PROTOCOL, async (request: Request) => {
      const requestUrl = request.url;
      const url = new URL(requestUrl);

      const fileName = sanitizeFilename(url.hostname);
      const filePath = path.join(this.cacheDirectory, fileName);

      const infoFilePath = getInfoFilePath(filePath);
      const cacheInfo = await this.getCacheInfo(infoFilePath, requestUrl);

      if (cacheInfo.state !== CacheState.CACHED) {
        return new Response('Not found', {
          status: 404,
          headers: {
            'content-type': 'text/plain',
          },
        });
      }

      let fileSize: number;
      try {
        const stats = await fs.stat(filePath);
        fileSize = stats.size;
      } catch (error) {
        return new Response('Not found', {
          status: 404,
          headers: {
            'content-type': 'text/plain',
          },
        });
      }

      const contentTypeHeader = cacheInfo.headers?.['content-type'];
      const contentType =
        (Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader) || 'application/octet-stream';

      const responseHeaders: Record<string, string> = {
        'content-type': contentType,
        'accept-ranges': 'bytes',
      };

      // Media elements seek by sending Range requests. Without 206 responses
      // seeking is broken and MP4 files with the moov atom at the end of the
      // file never start playing.
      const range = parseRangeHeader(request.headers.get('range'), fileSize);

      if (range === 'invalid') {
        return new Response('Range Not Satisfiable', {
          status: 416,
          headers: {
            'content-type': 'text/plain',
            'content-range': `bytes */${fileSize}`,
          },
        });
      }

      if (range !== 'ignore') {
        responseHeaders['content-length'] = String(range.end - range.start + 1);
        responseHeaders['content-range'] = `bytes ${range.start}-${range.end}/${fileSize}`;

        const partialStream = createReadStream(filePath, { start: range.start, end: range.end });
        return new Response(Readable.toWeb(partialStream) as unknown as ReadableStream, {
          status: 206,
          headers: responseHeaders,
        });
      }

      responseHeaders['content-length'] = String(fileSize);

      return new Response(Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream, {
        headers: responseHeaders,
      });
    });
  }

  private prepareIPC() {
    ipcMainHandle(CacheAPI.GET_CACHE_SIZE, () => this.getCacheSize());
    ipcMainHandle(CacheAPI.CLEAR_CACHE, () => this.clearCache());
    ipcMainHandle(CacheAPI.SET_CACHE_DIRECTORY, () => this.setCacheDirectory());
    ipcMainHandle(CacheAPI.SET_MAX_CACHE_SIZE, (newSize: number) => this.setMaxCacheSize(newSize));
    ipcMainHandle(CacheAPI.GET_CONTENT, (url: string, options?: { maxSize?: number; timeout?: number }) =>
      this.getContent(url, options),
    );
    ipcMainHandle(CacheAPI.GET_HEADERS, (url: string, options?: { maxSize?: number; timeout?: number }) =>
      this.getHeaders(url, options),
    );
    ipcMainHandle(CacheAPI.GET_CHECKSUM, (url: string, options?: { maxSize?: number; timeout?: number }) =>
      this.getChecksum(url, options),
    );
    ipcMainHandle(CacheAPI.GET_URI, (url: string, options?: { maxSize?: number; timeout?: number }) =>
      this.getURI(url, options),
    );
    ipcMainHandle(CacheAPI.INVALIDATE, (url: string) => this.invalidate(url));
    ipcMainHandle(CacheAPI.GET_CACHE_INFOS, (urls: string[]) => this.getCacheInfos(urls));

    ipcMainHandle(CacheAPI.GET_CACHE_DIRECTORY, () => this.cacheDirectory);
    ipcMainHandle(CacheAPI.GET_MAX_CACHE_SIZE, () => this.maxCacheSize);
  }

  public bindEvents(window: BrowserWindow) {
    function onCacheDirectoryChanged(newDirectory: string) {
      window.webContents.send(CacheAPI.ON_CACHE_DIRECTORY_CHANGED, newDirectory);
    }

    function onMaxCacheSizeChanged(newSize: number) {
      window.webContents.send(CacheAPI.ON_MAX_CACHE_SIZE_CHANGED, newSize);
    }

    // Download and invalidation bursts emit sizeChanged per file, and every
    // notification triggers a full cache-directory scan (here and again in the
    // renderer), so coalesce bursts into one trailing notification. Scans are
    // also serialized: events arriving while a scan is running only mark it
    // stale, and one follow-up scan is scheduled after it finishes, so a scan
    // that outlives the coalescing window cannot overlap the next one.
    let sizeChangedTimeout: NodeJS.Timeout | undefined;
    let sizeScanRunning = false;
    let sizeChangedDuringScan = false;

    const onSizeChanged = () => {
      if (sizeChangedTimeout) {
        return;
      }
      if (sizeScanRunning) {
        sizeChangedDuringScan = true;
        return;
      }
      sizeChangedTimeout = setTimeout(async () => {
        sizeChangedTimeout = undefined;
        sizeScanRunning = true;
        try {
          const size = await this.getCacheSize();
          if (!window.isDestroyed()) {
            window.webContents.send(CacheAPI.ON_SIZE_CHANGED, size);
          }
        } catch {
          // the next sizeChanged event delivers a fresh value
        } finally {
          sizeScanRunning = false;
          if (sizeChangedDuringScan) {
            sizeChangedDuringScan = false;
            onSizeChanged();
          }
        }
      }, 500);
    };

    this.on('cacheDirectoryChanged', onCacheDirectoryChanged);
    this.on('maxCacheSizeChanged', onMaxCacheSizeChanged);
    this.on('sizeChanged', onSizeChanged);

    const unbind = () => {
      this.off('cacheDirectoryChanged', onCacheDirectoryChanged);
      this.off('maxCacheSizeChanged', onMaxCacheSizeChanged);
      this.off('sizeChanged', onSizeChanged);
      sizeChangedDuringScan = false;
      if (sizeChangedTimeout) {
        clearTimeout(sizeChangedTimeout);
        sizeChangedTimeout = undefined;
      }
    };

    window.on('close', () => {
      unbind();
    });

    return unbind;
  }

  async init() {
    await ensureDirectoryExists(this.cacheDirectory);
  }

  public get maxCacheSize(): number {
    return this.#maxCacheSize;
  }

  public set maxCacheSize(newSize: number | string) {
    const value = sanitizeNumber(newSize);

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
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const fileName = `${urlHash}${FILE_SUFFIX}`;
    return path.join(this.cacheDirectory, fileName);
  }

  private getCacheInfoFilePath(url: string) {
    const filePath = this.getCacheFilePath(url);
    return getInfoFilePath(filePath);
  }

  // url is here cache://filename
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
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

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
    } = {},
  ): Promise<CacheInfo> {
    const { maxSize = MAX_FILE_SIZE, timeout = 30_000 } = options;

    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

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

        if (!isValidURL(normalizedURL)) {
          throw new Error(`Invalid URL: ${normalizedURL}`);
        }

        const cacheInfo = await this.getCacheInfoByURL(url);
        if (cacheInfo.state === CacheState.CACHED) {
          log('Url already downloaded', url);
          return cacheInfo;
        }

        if (cacheInfo.state === CacheState.ERROR) {
          log(`Url already downloaded with error: ${cacheInfo.error}`, url);

          const isTransientError = ['Response aborted', 'Request aborted'].includes(cacheInfo.error);
          // A persisted timeout settles for the rest of the session, but is
          // retried in later sessions — a one-off network problem must not
          // disable the preview until the whole cache is cleared.
          const isRetriableTimeout = isDownloadTimeoutError(cacheInfo.error) && !this.timedOutUrls.has(url);
          // A persisted size-limit error is only retried when the caller lifts
          // the limit, so oversized files are not re-downloaded on every visit.
          const isSizeLimitLifted = cacheInfo.error === MAX_FILE_SIZE_EXCEEDED_ERROR && maxSize <= 0;
          if (!isTransientError && !isRetriableTimeout && !isSizeLimitLifted) {
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
            overrideFile: true,
          });

          log('Download finished', url);

          // compute checksum
          const checksum = await getChecksum(cacheFilePath);

          log('Checksum computed', url);

          // save headers to a local JSON file
          const updatedCacheInfo = await this.setCacheInfo(url, {
            state: CacheState.CACHED,
            headers,
            checksum,
          });

          log('Cache info saved', url);
          try {
            // remove old files if the cache is full
            const currentCacheSize = await this.getCacheSize();
            if (this.maxCacheSize > 0 && currentCacheSize > this.maxCacheSize) {
              // The current size already includes the file that was just
              // downloaded. Keep that file available to the caller and evict
              // older entries down to the configured total-size target.
              await this.removeOldestFiles(this.maxCacheSize, cacheFilePath);
            }
          } catch (housekeepingError) {
            // The download and its cache info are already saved — a failure in
            // cache bookkeeping must not overwrite that state with an error.
            log(`Cache housekeeping failed: ${(housekeepingError as Error).message}`, url);
          }
          // todo just add size and save it locally
          this.emit('sizeChanged');

          return updatedCacheInfo;
        };

        return await this.#downloadLimit<CacheInfo>(() => limitedRemoteFileDownload());
      } catch (error) {
        // Not a property of the URL, just of the current preference: while
        // the IPFS gateway option is off the fetch is refused before it
        // starts. Persisting that as a cache error would keep the entry
        // poisoned after the user turns the option on, so it propagates
        // instead — already-cached content was served above regardless.
        if (error instanceof IpfsGatewayDisabledError) {
          throw error;
        }

        const currentError = (error as Error) ?? new Error('Unknown fetchRemoteContent error');

        if (isDownloadTimeoutError(currentError.message)) {
          this.timedOutUrls.add(url);
        }

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
    },
  ): Promise<Headers> {
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

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
    },
  ): Promise<Buffer> {
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

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
    },
  ): Promise<string> {
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

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
    },
  ) {
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    const cacheInfo = await this.fetchRemoteContent(url, options);

    if (cacheInfo.state === CacheState.ERROR) {
      throw new Error(cacheInfo.error);
    }

    if (cacheInfo.state === CacheState.NOT_CACHED) {
      throw new Error('Url is not cached');
    }

    if (cacheInfo.state === CacheState.CACHED) {
      const filePath = this.getCacheFilePath(url);
      return `${CACHE_PROTOCOL}://${path.basename(filePath)}`;
    }

    throw new Error('Unknown cache state');
  }

  // Reports what the cache already knows about each url without fetching
  // anything: a download that never happened stays NOT_CACHED, and a url the
  // cache cannot key at all is reported as an error instead of failing the
  // whole batch. This lets the renderer classify NFTs that are not on screen
  // (and so never verify their files) from outcomes persisted by earlier
  // visits and sessions.
  async getCacheInfos(urls: string[]): Promise<CacheInfo[]> {
    return Promise.all(
      urls.map(async (url) => {
        try {
          return await this.getCacheInfoByURL(url);
        } catch (error) {
          return {
            url,
            state: CacheState.ERROR,
            error: (error as Error).message,
            timestamp: Date.now(),
          };
        }
      }),
    );
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

  async setCacheDirectory() {
    const { cacheDirectory } = this;

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: cacheDirectory,
    });

    if (result.canceled || !result.filePaths[0]) {
      return;
    }

    const newDirectory = result.filePaths[0];

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

  private async removeOldestFiles(targetSize: number, preserveFilePath?: string): Promise<void> {
    const files = await fs.readdir(this.cacheDirectory);
    const filePaths = files
      .filter((file) => isChiaCacheFile(file) && !isChiaCacheInfoFile(file))
      .map((file) => path.join(this.cacheDirectory, file));

    // Include the sidecar metadata in each entry's size so the eviction total
    // uses the same accounting as getCacheSize().
    const fileStats = (
      await Promise.all(
        filePaths.map(async (filePath) => {
          try {
            const stats = await fs.stat(filePath);
            let infoSize = 0;
            try {
              infoSize = (await fs.stat(getInfoFilePath(filePath))).size;
            } catch {
              // A missing sidecar is cleaned up with the data file as usual.
            }

            return {
              filePath,
              size: stats.size + infoSize,
              mtime: stats.mtime,
            };
          } catch {
            // Deleted by invalidation while scanning — nothing left to evict.
            return undefined;
          }
        }),
      )
    ).filter((entry): entry is { filePath: string; size: number; mtime: Date } => entry !== undefined);

    // sort the file paths based on their last modified time (oldest first)
    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    // remove files until the total size is below the new max total size
    let totalSize = fileStats.reduce((sum, { size }) => sum + size, 0);
    const filesToRemove: typeof fileStats = [];
    for (const fileStat of fileStats) {
      if (totalSize <= targetSize) {
        break;
      }

      if (fileStat.filePath !== preserveFilePath) {
        totalSize -= fileStat.size;
        filesToRemove.push(fileStat);
      }
    }

    await Promise.all(
      filesToRemove.map(async ({ filePath }) => {
        await safeUnlink(filePath);
        await safeUnlink(getInfoFilePath(filePath));
      }),
    );

    this.emit('sizeChanged');
  }

  async invalidate(url: string) {
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
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
    this.maxCacheSize = maxCacheSize;
    if (this.maxCacheSize > 0) {
      await this.removeOldestFiles(this.maxCacheSize);
    }
  }

  async getCacheSize() {
    const files = await fs.readdir(this.cacheDirectory);
    const filePaths = files
      .filter((filename) => isChiaCacheFile(filename))
      .map((filename) => path.join(this.cacheDirectory, filename));

    // Invalidation and eviction delete files while this scan runs — a file
    // that vanished between readdir and stat no longer occupies space.
    const fileSizes = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          return (await fs.stat(filePath)).size;
        } catch {
          return 0;
        }
      }),
    );
    const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);

    return totalSize;
  }
}
