import { BrowserWindow, dialog, type Protocol } from 'electron';
import { EventEmitter } from 'events';
import crypto from 'node:crypto';
import { createReadStream, type Stats } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import debug from 'debug';

import type CacheInfo from '../@types/CacheInfo';
import type CacheInfoBase from '../@types/CacheInfoBase';
import type { CacheContent, CacheRequestOptions } from '../@types/CacheService';
import type Headers from '../@types/Headers';
import type IpfsGatewayHealth from '../@types/IpfsGatewayHealth';
import CacheState from '../constants/CacheState';
import {
  DOWNLOAD_DEADLINE_ERROR_PREFIX,
  INACTIVITY_TIMEOUT_ERROR_PREFIX,
  MAX_TRANSIENT_RETRIES,
  TRANSIENT_ERROR_RETRY_DELAY,
  isHostUnreachableError,
  transientErrorRetryDelay,
} from '../util/downloadErrors';
import ipfsToGatewayUrl, {
  getGatewayHost,
  getIpfsPathFromAnyUrl,
  getIpfsPathFromGatewayUrl,
  isIpfsBackedUrl,
  isIpfsUrl,
} from '../util/ipfs';
import limit from '../util/limit';

import CacheAPI from './constants/CacheAPI';
import ColdIpfsPathError from './utils/ColdIpfsPathError';
import DownloadDeadline, { normalizeDownloadDuration } from './utils/DownloadDeadline';
import SharedDownloadBudgetSpentError from './utils/SharedDownloadBudgetSpentError';
import downloadFile, {
  MAX_FILE_SIZE_EXCEEDED_ERROR,
  TEMP_FILE_SUFFIX,
  isTransientDownloadError,
  normalizeMaxSize,
  normalizeTimeout,
} from './utils/downloadFile';
import ensureDirectoryExists from './utils/ensureDirectoryExists';
import getChecksum from './utils/getChecksum';
import ipcMainHandle from './utils/ipcMainHandle';
import { IpfsGatewayDisabledError, ipfsGatewayBase, ipfsGatewayEnabled } from './utils/ipfsGateway';
import isValidURL from './utils/isValidURL';
import probeIpfsGateway from './utils/probeIpfsGateway';
import sanitizeFilename from './utils/sanitizeFilename';
import sanitizeNumber from './utils/sanitizeNumber';

const log = debug('chia-gui:CacheManager');

export const CACHE_PROTOCOL = 'cache';

// A single-range `bytes=start-end` Range header, parsed against the file size.
// 'ignore' means the header is absent or uses a form we do not support
// (e.g. multiple ranges), in which case the full file is served with a 200.
type ParsedRange = { start: number; end: number } | 'invalid' | 'ignore';

type DownloadPolicy = { maxSize: number; maxDuration: number; timeout: number };

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
// The transient-failure retry schedule is shared with the renderer's gallery
// filter (getNFTPreviewStatusFromCache) and lives in util/downloadErrors.
export {
  TRANSIENT_ERROR_RETRY_DELAY,
  MAX_TRANSIENT_ERROR_RETRY_DELAY,
  MAX_TRANSIENT_RETRIES,
  transientErrorRetryDelay,
} from '../util/downloadErrors';

const FILE_SUFFIX = '-chiacache';
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB
const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB

// How many requests in a row must fail to reach the gateway host before the
// gateway is reported unreachable (IpfsGatewayHealth). One failure is a
// resolver hiccup; three requests to three names that all fail the same way
// while nothing succeeds is the address.
export const GATEWAY_UNREACHABLE_THRESHOLD = 3;

// How long the gateway is not asked again for content it just failed to
// produce (see coldIpfsPaths). The same as the first transient retry delay:
// the url that established the verdict is not retried sooner either, and the
// siblings that inherit it should not fare better than it does.
export const COLD_IPFS_PATH_DURATION = TRANSIENT_ERROR_RETRY_DELAY;
// How long no request goes to a host that has just answered 429. Long enough
// for a per-minute limit to open up, short enough that the tiles in view are
// not blanked by one burst.
export const RATE_LIMIT_COOLDOWN = 30 * 1000;

// Bounds on one getCacheInfos call (see there). The renderer's sweep asks for
// at most 500 urls at a time; the cap leaves headroom for that and refuses
// anything that could only come from somewhere else.
export const MAX_CACHE_INFO_LOOKUPS = 1000;
const CACHE_INFO_LOOKUP_CONCURRENCY = 16;
// How many files a directory scan (size accounting, eviction) stats at a
// time. Stat-ing every file at once stalls the main thread for the better
// part of a second on a cache of a few hundred thousand entries, and the
// scans run after every completed download.
const FILE_STAT_CONCURRENCY = 64;

// Every file the cache owns: the data file, its `-info` sidecar, and the
// `.tmp` file a download streams into before it is renamed into place. The
// temp files count too — an interrupted download (quit, crash, a failed
// cleanup) leaves one behind, and a file the size accounting, eviction and
// "Clear cache" cannot see would grow the directory past the user's limit
// with no way to reclaim it from the UI.
// A sidecar is written beside its final name and renamed into place, so the
// cache owns a fourth kind of file for the length of that write.
const INFO_TEMP_SUFFIX = `${INFO_SUFFIX}${TEMP_FILE_SUFFIX}`;
const SUFFIXES = [
  FILE_SUFFIX,
  `${FILE_SUFFIX}${INFO_SUFFIX}`,
  `${FILE_SUFFIX}${TEMP_FILE_SUFFIX}`,
  `${FILE_SUFFIX}${INFO_TEMP_SUFFIX}`,
];

function isChiaCacheFile(filePath: string) {
  return SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

// A sidecar, finished or still being written: never a data file.
function isChiaCacheInfoFile(filePath: string) {
  return isChiaCacheFile(filePath) && (filePath.endsWith(INFO_SUFFIX) || filePath.endsWith(INFO_TEMP_SUFFIX));
}

// A file a write is streaming into, data or sidecar; stale once no write is.
function isChiaCacheTempFile(filePath: string) {
  return (
    filePath.endsWith(`${FILE_SUFFIX}${TEMP_FILE_SUFFIX}`) || filePath.endsWith(`${FILE_SUFFIX}${INFO_TEMP_SUFFIX}`)
  );
}

function getInfoFilePath(filePath: string) {
  return `${filePath}${INFO_SUFFIX}`;
}

// Whether a sidecar claims its data file is present. An unreadable sidecar is
// left alone: the lookup path reports it on its own terms.
async function isCachedSidecar(infoFilePath: string): Promise<boolean> {
  try {
    const info = JSON.parse(await fs.readFile(infoFilePath, 'utf-8')) as Partial<CacheInfo>;
    return info.state === CacheState.CACHED;
  } catch {
    return false;
  }
}

// The type the cache: response declares for a file. A media type the
// preview renders — image, video, audio, model — is passed through from the
// remote header with whatever parameters it carries (codecs, charset), as
// long as they are well formed. Anything else — a document type, a script
// type, nothing at all — is served as an opaque byte stream, which the
// renderer's image and media elements still decode by sniffing, as they did
// before the header was constrained, and which is never read as a document.
const MEDIA_TYPE = /^(image|video|audio|model)\/[\w.+-]+$/i;
// A parameter is printable ASCII, quoted or bare: a NUL, a control character
// or a code point outside Latin-1 is not a header value the response can
// carry, and a value the response cannot carry would fail the whole file.
const MEDIA_TYPE_PARAMETER = /^[\w.+-]+=(?:"[\x20-\x21\x23-\x7e]*"|[\x21\x23-\x3a\x3c-\x7e]+)$/;

export function servedContentType(contentType: string | undefined): string {
  const [type, ...parameters] = (contentType ?? '').split(';').map((part) => part.trim());
  if (!MEDIA_TYPE.test(type) || !parameters.every((parameter) => MEDIA_TYPE_PARAMETER.test(parameter))) {
    return 'application/octet-stream';
  }
  return [type, ...parameters].join('; ');
}

// Bound on remembered cold-content verdicts before expired ones are swept.
const MAX_COLD_IPFS_PATHS = 4096;

// The key of a cold-content verdict: the gateway it belongs to and the ipfs
// path (`<CID>[/path][?query]`) it is about. A space cannot occur
// in a gateway base, so the two parts never blur.
function coldIpfsPathKey(gateway: string, ipfsPath: string): string {
  return `${gateway} ${ipfsPath}`;
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
      // for ipfs:// URLs: the gateway base the request was started through
      gateway?: string;
      deadline: DownloadDeadline;
    }
  > = new Map();

  // URLs whose download failed transiently during this session. A persisted
  // transient failure is retried once per session and again whenever the retry
  // delay has elapsed since it was recorded — the set keeps a stalled or
  // challenging host from being retried (and holding a download slot) on every
  // access in between.
  private transientFailureUrls: Set<string> = new Set();

  // The gateway's reachability as the downloads through it report it: the
  // current run of requests that could not reach the host, and the verdict
  // last announced to the renderer (undefined until one is). A verdict is on
  // one gateway; a request through another gateway starts both over.
  private gatewayHostFailures: { gateway: string; count: number; error: string } | undefined;

  private gatewayHealth: IpfsGatewayHealth | undefined;

  // Content the gateway failed to produce a moment ago, so that no other url
  // naming the same content sends it back for the same answer: a dead CID is
  // typically listed twice per NFT (a gateway link and its ipfs:// twin) and
  // once more per file, and every one of those would otherwise hold one of the
  // few download slots for the whole deadline. Keyed by gateway and ipfs path
  // — the verdict is the gateway's. A failed path says nothing about siblings
  // in the same CID: a directory may have only some blocks pinned, and a host
  // may fail a particular path. A verdict reached after the content's own
  // host had failed too (`twoHosts`) also spares the direct leg of other links naming
  // that exact content: two hosts that cannot produce it are not made three.
  // Entries expire after COLD_IPFS_PATH_DURATION; see getColdIpfsPath.
  private coldIpfsPaths: Map<string, { until: number; error: string; twoHosts: boolean }> = new Map();

  // Hosts that answered 429, and when they may be asked again. Keyed by the
  // operator's host (getGatewayHost: the hostname less a subdomain gateway's
  // `<CID>.ipfs.` label, so every file on that gateway shares the cooldown):
  // a rate limit is the host's, whether it was reached as a link's own host
  // or as the gateway.
  private hostCooldowns: Map<string, number> = new Map();

  private readonly rateLimitCooldown: number;

  // When a gateway last answered after a run of requests that could not reach
  // it. Failures recorded against it before that moment were verdicts on an
  // unreachable host, not on the content, and are retried on the next access
  // instead of waiting out their retry delay (see isSettledOutcome).
  private gatewayRecoveredAt: Map<string, number> = new Map();

  // Clear, migration and invalidation share one barrier. Waiters must not enter
  // the request map until admitted: maintenance drains that map, so a request
  // which itself awaits maintenance would create a circular wait.
  private maintenance: Promise<void> | undefined;

  private clearing: Promise<void> | undefined;

  private eviction: Promise<void> = Promise.resolve();

  private maintenanceGeneration = 0;

  // Only disk reads enter this map; they never wait for maintenance or fetches.
  private activeReads = new Map<Promise<Buffer>, { url: string; filePath: string }>();

  constructor(
    options: {
      cacheDirectory?: string;
      maxCacheSize?: number | string;
      concurrency?: number;
      rateLimitCooldown?: number;
    } = {},
  ) {
    super();

    const {
      cacheDirectory = './cache',
      maxCacheSize = MAX_TOTAL_SIZE,
      concurrency = 10,
      rateLimitCooldown = RATE_LIMIT_COOLDOWN,
    } = options;
    this.rateLimitCooldown = rateLimitCooldown;

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
      const contentType = servedContentType(
        Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader,
      );

      const responseHeaders: Record<string, string> = {
        'content-type': contentType,
        'accept-ranges': 'bytes',
        // The bytes and their declared type both come from whoever served the
        // NFT's file. They are only ever shown through <img>, <video> and
        // <audio>, so a response that could be read as a document — and its
        // scripts — is denied here as well as by the renderer's policy.
        'content-security-policy': "default-src 'none'; sandbox",
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

  // An fs error names the file it failed on, absolute path included, and the
  // cache directory is somewhere under the user's home. Such a message stays
  // in the main-process log; what crosses to the renderer, or is persisted
  // in a sidecar it can read, says only what went wrong.
  redactCachePath(error: unknown): Error {
    const original = error instanceof Error ? error : new Error(String(error));
    if (!original.message.includes(this.cacheDirectory)) {
      return original;
    }
    log(`Cache file operation failed: ${original.message}`);
    const { code } = original as { code?: string };
    return new Error(`${code ?? 'EIO'}: cache file operation failed`);
  }

  private prepareIPC() {
    const guarded =
      <Args extends unknown[], Result>(handler: (...args: Args) => Promise<Result> | Result) =>
      async (...args: Args): Promise<Result> => {
        try {
          return await handler(...args);
        } catch (error) {
          throw this.redactCachePath(error);
        }
      };

    ipcMainHandle(
      CacheAPI.GET_CACHE_SIZE,
      guarded(() => this.getCacheSize()),
    );
    ipcMainHandle(
      CacheAPI.CLEAR_CACHE,
      guarded(() => this.clearCache()),
    );
    ipcMainHandle(
      CacheAPI.SET_CACHE_DIRECTORY,
      guarded(() => this.setCacheDirectory()),
    );
    ipcMainHandle(
      CacheAPI.SET_MAX_CACHE_SIZE,
      guarded((newSize: number) => this.setMaxCacheSize(newSize)),
    );
    ipcMainHandle(
      CacheAPI.GET_CONTENT_WITH_INFO,
      guarded((url: string, options?: CacheRequestOptions) => this.getContentWithInfo(url, options)),
    );
    ipcMainHandle(
      CacheAPI.GET_CONTENT,
      guarded((url: string, options?: CacheRequestOptions) => this.getContent(url, options)),
    );
    ipcMainHandle(
      CacheAPI.GET_HEADERS,
      guarded((url: string, options?: CacheRequestOptions) => this.getHeaders(url, options)),
    );
    ipcMainHandle(
      CacheAPI.GET_CHECKSUM,
      guarded((url: string, options?: CacheRequestOptions) => this.getChecksum(url, options)),
    );
    ipcMainHandle(
      CacheAPI.GET_URI,
      guarded((url: string, options?: CacheRequestOptions) => this.getURI(url, options)),
    );
    ipcMainHandle(
      CacheAPI.INVALIDATE,
      guarded((url: string) => this.invalidate(url)),
    );
    ipcMainHandle(
      CacheAPI.GET_CACHE_INFOS,
      guarded((urls: string[]) => this.getCacheInfos(urls)),
    );

    ipcMainHandle(
      CacheAPI.PROBE_IPFS_GATEWAY,
      guarded((gateway: string) => this.probeIpfsGateway(gateway)),
    );
    ipcMainHandle(CacheAPI.GET_IPFS_GATEWAY_HEALTH, () => this.getIpfsGatewayHealth());
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

    function onIpfsGatewayHealthChanged(health: IpfsGatewayHealth) {
      if (!window.isDestroyed()) {
        window.webContents.send(CacheAPI.ON_IPFS_GATEWAY_HEALTH_CHANGED, health);
      }
    }

    this.on('cacheDirectoryChanged', onCacheDirectoryChanged);
    this.on('maxCacheSizeChanged', onMaxCacheSizeChanged);
    this.on('sizeChanged', onSizeChanged);
    this.on('ipfsGatewayHealthChanged', onIpfsGatewayHealthChanged);

    const unbind = () => {
      this.off('cacheDirectoryChanged', onCacheDirectoryChanged);
      this.off('maxCacheSizeChanged', onMaxCacheSizeChanged);
      this.off('sizeChanged', onSizeChanged);
      this.off('ipfsGatewayHealthChanged', onIpfsGatewayHealthChanged);
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
    await this.removeStaleTempFiles();
  }

  // Deletes the temp files of downloads that are not in flight. At startup
  // that is every temp file: none can belong to a live download. Errors are
  // ignored — a file that cannot be removed is still counted and evictable.
  private async removeStaleTempFiles() {
    let files: string[];
    try {
      files = await fs.readdir(this.cacheDirectory);
    } catch (error) {
      log(`Could not list the cache directory for stale temp files: ${(error as Error).message}`);
      return;
    }

    const inFlight = this.inFlightTempFilePaths();
    await Promise.all(
      files
        .filter((file) => isChiaCacheTempFile(file))
        .map((file) => path.join(this.cacheDirectory, file))
        .filter((filePath) => !inFlight.has(filePath))
        .map((filePath) => safeUnlink(filePath)),
    );
  }

  // The temp files that downloads currently in flight are writing to. Their
  // urls are the ongoing requests; a temp file that is not one of these is a
  // leftover no download will ever finish.
  private inFlightTempFilePaths(): Set<string> {
    const paths = new Set<string>();
    this.ongoingRequests.forEach((_request, url) => {
      try {
        paths.add(`${this.getCacheFilePath(url)}${TEMP_FILE_SUFFIX}`);
      } catch {
        // a url the cache cannot key has no file
      }
    });
    return paths;
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
      const { code } = currentError as { code?: string };
      if (code === 'ENOENT') {
        return {
          url,
          state: CacheState.NOT_CACHED,
          timestamp: Date.now(),
        };
      }

      // A sidecar that is not JSON is one this cache did not finish writing
      // (a crash before the atomic rename existed, a disk error). Nothing in
      // it can be trusted, and reporting it as an error would settle the
      // entry for good; it is removed and the entry fetched afresh instead.
      if (currentError instanceof SyntaxError) {
        log(`Removing an unreadable cache info for ${url}`);
        await safeUnlink(filePath);
        return {
          url,
          state: CacheState.NOT_CACHED,
          timestamp: Date.now(),
        };
      }

      // The full message of an fs error embeds the absolute path of the
      // sidecar — the user's home directory included — and this record is
      // handed to the renderer (getCacheInfos). The code says what went
      // wrong; the path stays in the main process log.
      log(`Could not read the cache info for ${url}: ${currentError.message}`);
      return {
        url,
        state: CacheState.ERROR,
        error: code ?? 'Cache info unreadable',
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

    // Renamed into place so that a crash mid-write leaves either the previous
    // sidecar or none, never a truncated one that would settle the entry.
    const tempInfoFilePath = `${infoFilePath}${TEMP_FILE_SUFFIX}`;
    await fs.writeFile(tempInfoFilePath, JSON.stringify(cacheInfo), 'utf-8');
    await fs.rename(tempInfoFilePath, infoFilePath);

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

  // Whether the persisted outcome for a url stands as it is — content that
  // is cached, or a failure the retry rules say not to retry now — so that
  // no transfer is called for. Shared by the transfer path and by callers
  // whose allowance can afford no transfer.
  private isPolicyLimitLifted(cacheInfo: CacheInfo, policy: DownloadPolicy): boolean {
    if (cacheInfo.state !== CacheState.ERROR) {
      return false;
    }
    return (
      (cacheInfo.error === MAX_FILE_SIZE_EXCEEDED_ERROR && policy.maxSize > (cacheInfo.maxSize ?? MAX_FILE_SIZE)) ||
      (cacheInfo.error.startsWith(DOWNLOAD_DEADLINE_ERROR_PREFIX) &&
        cacheInfo.maxDuration !== undefined &&
        policy.maxDuration > cacheInfo.maxDuration) ||
      (cacheInfo.error.startsWith(INACTIVITY_TIMEOUT_ERROR_PREFIX) &&
        cacheInfo.timeout !== undefined &&
        policy.timeout > cacheInfo.timeout)
    );
  }

  private isSettledOutcome(cacheInfo: CacheInfo, url: string, policy: DownloadPolicy): boolean {
    if (cacheInfo.state === CacheState.CACHED) {
      return true;
    }
    if (cacheInfo.state !== CacheState.ERROR) {
      return false;
    }

    const isAbortError = ['Response aborted', 'Request aborted'].includes(cacheInfo.error);
    // A persisted transient failure (timeout, 5xx, rate limit, bot
    // challenge, network error) is retried once per session, and again
    // within the session once its retry delay has elapsed — a one-off
    // gateway problem must not disable the preview until the whole
    // cache is cleared. The delay grows with every consecutive failure
    // and the in-session retries stop after MAX_TRANSIENT_RETRIES, so
    // a host that never recovers is not re-probed every ten minutes for
    // the life of the process. Sidecars written without a timestamp
    // fall back to the once-per-session rule.
    const retries = cacheInfo.retries ?? 0;
    const isRetriableTransientError =
      isTransientDownloadError(cacheInfo.error) &&
      (!this.transientFailureUrls.has(url) ||
        (retries < MAX_TRANSIENT_RETRIES && Date.now() - cacheInfo.timestamp >= transientErrorRetryDelay(retries)));
    // A caller limit describes that attempt, not the resource. Keep backoff
    // at the same or smaller limits, but allow a larger caller its own try.
    const isLimitLifted = this.isPolicyLimitLifted(cacheInfo, policy);
    // An ipfs failure is a verdict on one gateway, not on the resource:
    // once the user points the option at another gateway the entry is
    // re-requested right away, whatever the error was and however
    // recently it was recorded. Only while the option is on, since with
    // it off there is no gateway to retry through and the refusal would
    // never settle. A sidecar that names its gateway is compared with
    // the current one; an https gateway link without a recorded gateway
    // failed without ever getting the fallback (the option was off, or
    // the sidecar predates it), so it gets one now — the attempt records
    // the gateway and settles it. An ipfs:// sidecar without a gateway
    // predates gateway tracking and follows the transient-error rules.
    const isGatewayChanged =
      isIpfsBackedUrl(url) &&
      ipfsGatewayEnabled() &&
      (cacheInfo.gateway === undefined ? !isIpfsUrl(url) : cacheInfo.gateway !== ipfsGatewayBase());
    // A failure to reach the gateway host whose transfer began before the
    // gateway was last seen answering says nothing about the content: the
    // host was down (or the address was wrong) and is not any more. Dated by
    // the transfer's start (startedAt), not the sidecar's write: a request in
    // flight when another one got through fails, and is written, after the
    // recovery was stamped, yet its failure predates it.
    const isRecoveredGatewayFailure =
      cacheInfo.gateway !== undefined &&
      isHostUnreachableError(cacheInfo.error) &&
      (this.gatewayRecoveredAt.get(cacheInfo.gateway) ?? 0) > (cacheInfo.startedAt ?? cacheInfo.timestamp);
    return (
      !isAbortError && !isRetriableTransientError && !isLimitLifted && !isGatewayChanged && !isRecoveredGatewayFailure
    );
  }

  async fetchRemoteContent(
    url: string,
    options: CacheRequestOptions = {},
    budget = { remaining: normalizeDownloadDuration(options.maxDuration) },
  ): Promise<CacheInfo> {
    // Both come from the renderer and reach a timer and a byte counter; see
    // the normalizers for what an absent, invalid or "unlimited" value means.
    const maxSize = normalizeMaxSize(options.maxSize);
    const timeout = normalizeTimeout(options.timeout);

    // Validate before coalescing, reading sidecars, or queuing network work.
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    // What is left of the caller's allowance bounds any transfer it starts or
    // joins. The floor is never reached: a spent allowance is turned away
    // below before it could start or join one.
    const maxDuration = Math.max(1, Math.min(normalizeDownloadDuration(options.maxDuration), budget.remaining));
    const policy = { maxSize, maxDuration, timeout };

    // Recheck after each await: another maintenance operation may have been
    // queued while this caller waited. No await separates the last check from
    // registration below, so every request is either admitted or held back.
    while (this.maintenance) {
      // eslint-disable-next-line no-await-in-loop -- Serialize admission against maintenance.
      await this.maintenance.catch(() => {});
    }

    // A spent allowance still reads the cache — content that is already
    // there costs nothing to serve, and a recheck after a join or a
    // maintenance wait commonly finds exactly that — but it buys no transfer:
    // not a seat on another caller's (joining would tighten that transfer's
    // deadline to the floor and abort a healthy download someone else is
    // waiting on) and none of its own. Decided here, before this caller could
    // register as the url's owner: a refusal raised from inside the transfer
    // would be caught below and persisted as a transient error against the
    // current gateway — a verdict on nothing — and inherited by every caller
    // that joined in the meantime. Nothing is written on this path.
    if (budget.remaining <= 0) {
      if (!this.ongoingRequests.has(url)) {
        const cacheInfo = await this.getCacheInfoByURL(url);
        if (this.isSettledOutcome(cacheInfo, url, policy)) {
          return cacheInfo;
        }
      }
      throw new SharedDownloadBudgetSpentError();
    }

    // Captured once, up front, and pinned for the download itself (which may
    // wait in the queue while the user changes the preference): the gateway a
    // request goes through is part of its outcome, so a failure must be
    // recorded against the gateway the request actually used. This covers
    // ipfs:// URIs and https gateway URLs alike — the latter fall back to the
    // configured gateway when their own host fails (see below), but only
    // while the option is on, so with it off a gateway link's failure is a
    // verdict on its own host alone and records no gateway; turning the
    // option on then gives the link its first fallback (isGatewayChanged).
    const requestGateway =
      isIpfsUrl(url) || (isIpfsBackedUrl(url) && ipfsGatewayEnabled()) ? ipfsGatewayBase() : undefined;

    // Charge actual admitted work, including a joined transfer, exactly once
    // per fetch decision. Rechecks after maintenance/gateway changes share this
    // budget instead of receiving another full metadata allowance.
    const consume = async (request: { promise: Promise<CacheInfo>; deadline: DownloadDeadline }) => {
      try {
        return await request.promise;
      } finally {
        // eslint-disable-next-line no-param-reassign -- Rechecks consume the caller's shared allowance.
        budget.remaining = Math.max(0, budget.remaining - request.deadline.elapsed());
      }
    };

    // Waiting on another caller's transfer, for this caller's own allowance
    // and no longer. The transfer itself is left as it is: its deadline is
    // its owner's, and a caller with a smaller allowance — a metadata fetch
    // whose NFT lists the url another NFT's video is downloading from — must
    // not be able to end it for everyone waiting on it. Queue wait is not
    // charged, as for a transfer of one's own; the clock starts with the
    // transfer's. A caller whose allowance runs out is refused with the
    // spent-budget error, nothing persisted, and charged for what it waited.
    const joinWithinBudget = async (request: { promise: Promise<CacheInfo>; deadline: DownloadDeadline }) => {
      await request.deadline.whenStarted();
      const startedAt = Date.now();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          request.promise,
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new SharedDownloadBudgetSpentError()), maxDuration);
          }),
        ]);
      } finally {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        // eslint-disable-next-line no-param-reassign -- The wait consumes the caller's shared allowance.
        budget.remaining = Math.max(0, budget.remaining - (Date.now() - startedAt));
      }
    };

    const ongoingRequest = this.ongoingRequests.get(url);
    if (ongoingRequest) {
      log('Request already ongoing', url);

      if (ongoingRequest.gateway !== requestGateway) {
        // The in-flight request went through a gateway the user has since
        // moved away from, so its outcome is a verdict on that gateway only.
        // Wait for it, then look again: a success is served from the cache,
        // a failure — recorded under the old gateway — is retried through
        // the current one by the gateway check below. Without this the
        // caller would inherit the old gateway's error until the retry delay
        // elapsed.
        const lookAgain = () => this.fetchRemoteContent(url, options, budget);
        return joinWithinBudget(ongoingRequest).then(lookAgain, lookAgain);
      }

      const outcome = await joinWithinBudget(ongoingRequest);
      // The first caller may have requested metadata while this caller wants
      // a larger/longer media transfer. Its limit failure cannot decide ours.
      // The old writer has fully settled before re-admission; the time already
      // spent waiting is charged above and is never granted again.
      if (budget.remaining > 0 && this.isPolicyLimitLifted(outcome, { ...policy, maxDuration: budget.remaining })) {
        return this.fetchRemoteContent(url, options, budget);
      }
      return outcome;
    }

    const abortController = new AbortController();
    const transferDeadline = new DownloadDeadline(maxDuration, () => abortController.abort());
    // set when the request was ended from outside — by maintenance (clear,
    // invalidation, see runMaintenance) or by the requester (abort) — rather
    // than by its own deadline
    let abortedByCaller = false;
    let ongoingRequestEntry:
      | {
          promise: Promise<CacheInfo>;
          abort: () => void;
          deadline: DownloadDeadline;
          gateway?: string;
        }
      | undefined;

    // the persisted outcome this attempt is retrying, if any — a transient
    // failure recorded on top of an earlier one continues its retry count
    let previousCacheInfo: CacheInfo | undefined;
    // whether the transfer went to the gateway — an ipfs:// URI always does, a
    // link served by the gateway's own host does too, and any other gateway
    // link only once its own host failed and the fallback ran — so an outcome
    // is charged to the gateway only when it was the gateway's
    const isSelfGatewayLink =
      requestGateway !== undefined && !isIpfsUrl(url) && getGatewayHost(url) === getGatewayHost(requestGateway);
    let gatewayLegUsed = requestGateway !== undefined && (isIpfsUrl(url) || isSelfGatewayLink);
    // when the transfer itself began — a failure to reach the gateway is dated
    // by this, not by when its sidecar was written (see isRecoveredGatewayFailure)
    let transferStartedAt: number | undefined;

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
        previousCacheInfo = cacheInfo;
        if (cacheInfo.state === CacheState.CACHED) {
          log('Url already downloaded', url);
          return cacheInfo;
        }

        if (cacheInfo.state === CacheState.ERROR) {
          log(`Url already downloaded with error: ${cacheInfo.error}`, url);
          if (this.isSettledOutcome(cacheInfo, url, policy)) {
            return cacheInfo;
          }

          log('Retrying download', url);
        }

        const limitedRemoteFileDownload = async (): Promise<CacheInfo> => {
          const cacheFilePath = this.getCacheFilePath(url);

          // One active-transfer deadline covers the original host and fallback.
          // Queue wait consumes no allowance; coalesced callers can tighten it.
          if (budget.remaining <= 0) {
            throw new SharedDownloadBudgetSpentError();
          }
          transferDeadline.start();
          transferStartedAt = Date.now();
          const downloadOptions = {
            timeout,
            maxSize,
            maxDuration: transferDeadline.remaining(),
            signal: abortController.signal,
            overrideFile: true,
            gatewayBase: requestGateway,
          };

          log('Starting download', url);
          let headers: Headers;
          try {
            headers = await downloadFile(url, cacheFilePath, downloadOptions);
          } catch (downloadError) {
            // the host itself said so, whether or not a fallback follows
            if ((downloadError as Error).message === 'HTTP error: 429') {
              this.noteRateLimited(getGatewayHost(url));
            }
            // An https gateway URL names its content by CID, so when its own
            // host fails (gone, rate limiting, challenging the request) the
            // same bytes can be fetched through the user's gateway and are
            // still verified against the on-chain hash. Only when the option
            // is on, the host is not already that gateway, the failure is
            // the host's — not an abort, a size cap, or the option itself —
            // and the shared deadline has time left.
            const timeLeft = transferDeadline.remaining();
            const fallbackUrl =
              timeLeft > 0 ? this.getGatewayFallbackUrl(url, requestGateway, downloadError as Error) : undefined;
            if (!fallbackUrl) {
              throw downloadError;
            }

            log(`Download failed (${(downloadError as Error).message}), retrying through the gateway`, url);
            gatewayLegUsed = true;
            headers = await downloadFile(url, cacheFilePath, {
              ...downloadOptions,
              requestUrl: fallbackUrl,
              maxDuration: timeLeft,
            });
          }

          transferDeadline.throwIfExpired();
          log('Download finished', url);
          if (gatewayLegUsed) {
            this.noteGatewayAnswered(requestGateway);
          }

          // compute checksum
          const checksum = await getChecksum(cacheFilePath);

          transferDeadline.throwIfExpired();
          log('Checksum computed', url);

          // save headers to a local JSON file
          const updatedCacheInfo = await this.setCacheInfo(url, {
            state: CacheState.CACHED,
            headers,
            checksum,
          });

          log('Cache info saved', url);
          await this.trimCache(cacheFilePath);

          return updatedCacheInfo;
        };

        const refuseColdContent = () => {
          if (requestGateway !== undefined) {
            const cold = this.getColdIpfsPath(requestGateway, url, { directLeg: !gatewayLegUsed });
            if (cold) {
              throw new ColdIpfsPathError(cold.error);
            }
          }
        };
        const requestHost =
          gatewayLegUsed && requestGateway !== undefined ? getGatewayHost(requestGateway) : getGatewayHost(url);
        const admitDownload = async (): Promise<CacheInfo | undefined> => {
          if (abortController.signal.aborted) {
            throw new Error('Request aborted');
          }
          // Another request may have failed since this one entered the queue.
          // Neither decision can be made only at enqueue time.
          refuseColdContent();
          if (this.hostCooldownRemaining(requestHost) > 0) {
            return undefined;
          }
          try {
            return await limitedRemoteFileDownload();
          } catch (error) {
            // Publish gateway outcomes before releasing the slot, so the very
            // next queued request sees its 429 or exact-path failure.
            if (gatewayLegUsed) {
              const { message } = transferDeadline.error ?? (error as Error);
              this.noteGatewayOutcome(requestGateway, message);
              this.noteGatewayContentFailure(requestGateway, url, message, !isIpfsUrl(url) && !isSelfGatewayLink);
            }
            throw error;
          }
        };
        for (;;) {
          refuseColdContent();
          // Cooldown waits hold no download slot and consume no transfer time.
          // eslint-disable-next-line no-await-in-loop -- Recheck a cooldown extended while queued or waiting.
          await this.waitForHostCooldown(requestHost, abortController.signal);
          // eslint-disable-next-line no-await-in-loop -- A changed admission decision releases its slot before retrying.
          const result = await this.#downloadLimit<CacheInfo | undefined>(admitDownload);
          if (result !== undefined) {
            return result;
          }
        }
      } catch (error) {
        // Not a property of the URL, just of the current preference: while
        // the IPFS gateway option is off the fetch is refused before it
        // starts. Persisting that as a cache error would keep the entry
        // poisoned after the user turns the option on, so it propagates
        // instead — already-cached content was served above regardless.
        if (
          error instanceof IpfsGatewayDisabledError ||
          error instanceof SharedDownloadBudgetSpentError ||
          error instanceof ColdIpfsPathError
        ) {
          throw error;
        }

        // A download ended from outside is no verdict on the url. Maintenance
        // deletes the entry as soon as this request settles, and a requester
        // that gave up is retried anyway (an abort never settles an entry).
        // Recording the abort and then running the post-download housekeeping
        // — a full size scan of the cache directory per aborted download —
        // would only hold back the clear that is waiting on this very request.
        if (abortedByCaller) {
          throw error;
        }

        const currentError = this.redactCachePath(
          transferDeadline.error ?? (error as Error) ?? new Error('Unknown fetchRemoteContent error'),
        );

        const isTransient = isTransientDownloadError(currentError.message);
        if (isTransient) {
          this.transientFailureUrls.add(url);
        }

        const failureInfo = await this.setCacheInfo(url, {
          state: CacheState.ERROR,
          error: currentError.message,
          // the cap this attempt ran under, so a later caller with a larger
          // one is retried and one with the same or a smaller one is not
          ...(currentError.message === MAX_FILE_SIZE_EXCEEDED_ERROR ? { maxSize } : {}),
          ...(currentError.message.startsWith(DOWNLOAD_DEADLINE_ERROR_PREFIX) ? { maxDuration } : {}),
          ...(currentError.message.startsWith(INACTIVITY_TIMEOUT_ERROR_PREFIX) ? { timeout } : {}),
          ...(isTransient ? { retries: this.consecutiveTransientFailures(previousCacheInfo, requestGateway) + 1 } : {}),
          // which gateway the verdict belongs to (see isGatewayChanged above)
          ...(requestGateway === undefined ? {} : { gateway: requestGateway }),
          // when a failure to reach the gateway began, so a recovery of the
          // gateway between the start and this write still releases it
          ...(gatewayLegUsed && isHostUnreachableError(currentError.message)
            ? { startedAt: transferStartedAt ?? Date.now() }
            : {}),
        });
        // Failed downloads own sidecars too, even when no data file arrived.
        await this.trimCache(this.getCacheFilePath(url));
        return failureInfo;
      } finally {
        transferDeadline.finish();
        // Clearing may have allowed a replacement request under this key.
        if (this.ongoingRequests.get(url) === ongoingRequestEntry) {
          this.ongoingRequests.delete(url);
        }
      }
    };

    const promise = process();

    ongoingRequestEntry = {
      abort: () => {
        abortedByCaller = true;
        abortController.abort();
      },
      promise,
      gateway: requestGateway,
      deadline: transferDeadline,
    };
    this.ongoingRequests.set(url, ongoingRequestEntry);

    return consume(ongoingRequestEntry);
  }

  /** Whether the configured gateway can be reached, as the downloads through
   * it have shown, or undefined while no verdict has been reached. */
  getIpfsGatewayHealth(): IpfsGatewayHealth | undefined {
    return this.gatewayHealth;
  }

  /** Asks the gateway at `input` for a well-known file once (see
   * probeIpfsGateway). An answer also clears an "unreachable" verdict on that
   * gateway: the user just saw it respond, so the tiles get to try again. */
  async probeIpfsGateway(input: string) {
    const result = await probeIpfsGateway(input);
    if (result.reachable) {
      this.noteGatewayAnswered(result.gateway);
    }
    return result;
  }

  // A request through `gateway` failed with `message`. A failure to reach the
  // host at all lengthens the current run against that gateway and, at the
  // threshold, announces the gateway unreachable; an HTTP status is an answer
  // and ends the run. Anything else — an abort from our side, a transfer that
  // stalled or outran its deadline — says nothing about the host either way.
  private noteGatewayOutcome(gateway: string | undefined, message: string) {
    if (gateway === undefined) {
      return;
    }
    if (message.startsWith('HTTP error: ')) {
      this.noteGatewayAnswered(gateway);
      return;
    }
    if (!isHostUnreachableError(message)) {
      return;
    }
    const failures =
      this.gatewayHostFailures?.gateway === gateway
        ? { ...this.gatewayHostFailures, count: this.gatewayHostFailures.count + 1, error: message }
        : { gateway, count: 1, error: message };
    this.gatewayHostFailures = failures;
    if (failures.count < GATEWAY_UNREACHABLE_THRESHOLD) {
      return;
    }
    const previous = this.gatewayHealth;
    if (previous?.gateway === gateway && !previous.reachable && previous.error === message) {
      // the same verdict, one failure longer — nothing new for the renderer
      this.gatewayHealth = { ...previous, failures: failures.count };
      return;
    }
    this.announceGatewayHealth({ gateway, reachable: false, error: message, failures: failures.count });
  }

  // The host at `gateway` answered something: a download completed, a status
  // came back, a probe got a status line. The run of failures against it
  // ends, and an "unreachable" verdict on it is withdrawn.
  private noteGatewayAnswered(gateway: string | undefined) {
    if (gateway === undefined) {
      return;
    }
    const wasFailing =
      this.gatewayHostFailures?.gateway === gateway ||
      (this.gatewayHealth?.gateway === gateway && !this.gatewayHealth.reachable);
    if (this.gatewayHostFailures?.gateway === gateway) {
      this.gatewayHostFailures = undefined;
    }
    const recoveredAt = Date.now();
    if (wasFailing) {
      // the failures recorded meanwhile are released for retry
      this.gatewayRecoveredAt.set(gateway, recoveredAt);
    }
    if (this.gatewayHealth?.gateway === gateway && !this.gatewayHealth.reachable) {
      this.announceGatewayHealth({ gateway, reachable: true, failures: 0, recoveredAt });
    }
  }

  private announceGatewayHealth(health: IpfsGatewayHealth) {
    this.gatewayHealth = health;
    this.emit('ipfsGatewayHealthChanged', health);
  }

  // The request for `url` through `gateway` ended in `message`. A 429 puts
  // the gateway on cooldown. A failure that is the content's — an HTTP status
  // or a gateway that stopped sending, not the host's unreachability, an
  // abort, a size cap, a refused redirect, or the caller's own deadline
  // running out (which says nothing about the content) — makes the ipfs path
  // cold for that gateway. Every status and timeout is scoped to the exact
  // path, even when its origin also failed: neither response proves that a
  // sibling file in the same CID is unavailable.
  private noteGatewayContentFailure(
    gateway: string | undefined,
    url: string,
    message: string,
    afterOriginFailed: boolean,
  ) {
    if (gateway === undefined) {
      return;
    }
    if (message === 'HTTP error: 429') {
      this.noteRateLimited(getGatewayHost(gateway));
      return;
    }
    const stoppedSending = message.startsWith(INACTIVITY_TIMEOUT_ERROR_PREFIX);
    const isContentFailure =
      (message.startsWith('HTTP error: ') || stoppedSending) &&
      !isHostUnreachableError(message) &&
      message !== MAX_FILE_SIZE_EXCEEDED_ERROR;
    if (!isContentFailure) {
      return;
    }
    const ipfsPath = getIpfsPathFromAnyUrl(url);
    if (!ipfsPath) {
      return;
    }
    const verdict = { until: Date.now() + COLD_IPFS_PATH_DURATION, error: message, twoHosts: afterOriginFailed };
    this.pruneColdIpfsPaths();
    this.coldIpfsPaths.set(coldIpfsPathKey(gateway, ipfsPath), verdict);
  }

  // The standing verdict on `url`'s content for `gateway`, if the gateway
  // failed to produce that exact path within
  // COLD_IPFS_PATH_DURATION. For the direct leg of a gateway link only a
  // verdict two hosts share counts: the gateway alone failing says nothing
  // about the link's own host. Expired verdicts are dropped as they are met.
  private getColdIpfsPath(
    gateway: string,
    url: string,
    options: { directLeg?: boolean } = {},
  ): { error: string } | undefined {
    const ipfsPath = getIpfsPathFromAnyUrl(url);
    if (!ipfsPath) {
      return undefined;
    }
    const key = coldIpfsPathKey(gateway, ipfsPath);
    const verdict = this.coldIpfsPaths.get(key);
    if (verdict) {
      if (verdict.until <= Date.now()) {
        this.coldIpfsPaths.delete(key);
      } else if (!options.directLeg || verdict.twoHosts) {
        return { error: verdict.error };
      }
    }
    return undefined;
  }

  // Refreshing an NFT (invalidate) means the user wants its files fetched
  // again — through every gateway, whatever the last one said about them.
  private forgetColdIpfsPath(url: string) {
    const ipfsPath = getIpfsPathFromAnyUrl(url);
    if (!ipfsPath) {
      return;
    }
    const suffix = ` ${ipfsPath}`;
    for (const key of Array.from(this.coldIpfsPaths.keys())) {
      if (key.endsWith(suffix)) {
        this.coldIpfsPaths.delete(key);
      }
    }
  }

  // Verdicts expire on their own; this keeps a session that meets thousands
  // of dead files from carrying every one of them until it does.
  private pruneColdIpfsPaths() {
    if (this.coldIpfsPaths.size < MAX_COLD_IPFS_PATHS) {
      return;
    }
    const now = Date.now();
    for (const [key, verdict] of Array.from(this.coldIpfsPaths.entries())) {
      if (verdict.until <= now) {
        this.coldIpfsPaths.delete(key);
      }
    }
  }

  private noteRateLimited(host: string | undefined) {
    if (host !== undefined) {
      this.hostCooldowns.set(host, Date.now() + this.rateLimitCooldown);
    }
  }

  private hostCooldownRemaining(host: string | undefined): number {
    const until = host === undefined ? undefined : this.hostCooldowns.get(host);
    if (host === undefined || until === undefined) {
      return 0;
    }
    const remaining = until - Date.now();
    if (remaining <= 0) {
      this.hostCooldowns.delete(host);
      return 0;
    }
    return remaining;
  }

  // Resolves once `host` may be asked again; rejects like an aborted
  // download if the request is abandoned (maintenance) in the meantime.
  private waitForHostCooldown(host: string | undefined, signal: AbortSignal): Promise<void> {
    const remaining = this.hostCooldownRemaining(host);
    if (remaining <= 0) {
      return Promise.resolve();
    }
    log(`Waiting ${remaining}ms for the host's rate limit`, host);
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onAbort = () => {
        clearTimeout(timer);
        reject(new Error('Request aborted'));
      };
      if (signal.aborted) {
        onAbort();
        return;
      }
      timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, remaining);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  // How many transient failures in a row the persisted outcome already
  // records — zero when there is none, when the last outcome was anything
  // other than a transient failure (a success, a settled error, an abort), or
  // when it went through a different gateway: a failure is a verdict on one
  // gateway, so a new gateway starts with a clean slate.
  private consecutiveTransientFailures(previous: CacheInfo | undefined, gateway: string | undefined): number {
    if (
      previous?.state !== CacheState.ERROR ||
      !isTransientDownloadError(previous.error) ||
      previous.gateway !== gateway
    ) {
      return 0;
    }

    return previous.retries ?? 0;
  }

  // The configured-gateway URL to refetch an https gateway URL from after its
  // own host failed, or undefined when no fallback applies.
  private getGatewayFallbackUrl(url: string, gatewayBase: string | undefined, error: Error): string | undefined {
    if (gatewayBase === undefined || !ipfsGatewayEnabled()) {
      return undefined;
    }

    const ipfsPath = getIpfsPathFromGatewayUrl(url);
    if (!ipfsPath) {
      // ipfs:// URIs already went through the gateway
      return undefined;
    }

    const isHostFailure =
      !['Response aborted', 'Request aborted', MAX_FILE_SIZE_EXCEEDED_ERROR].includes(error.message) &&
      !(error instanceof IpfsGatewayDisabledError);
    if (!isHostFailure) {
      return undefined;
    }
    // Not for content the gateway failed to produce a moment ago, nor while it
    // is rate limiting us: the link's own failure stands, and is retried on
    // its own schedule.
    if (this.getColdIpfsPath(gatewayBase, url) || this.hostCooldownRemaining(getGatewayHost(gatewayBase)) > 0) {
      return undefined;
    }

    const fallbackUrl = ipfsToGatewayUrl(`ipfs://${ipfsPath}`, gatewayBase);
    // The URL is already served by the configured gateway — the same host in
    // path style, or that host behind a `<CID>.ipfs.` subdomain — so a retry
    // through it would ask the operator that just failed: nothing else to try.
    if (fallbackUrl === url || getGatewayHost(url) === getGatewayHost(gatewayBase)) {
      return undefined;
    }

    return fallbackUrl;
  }

  async getHeaders(url: string, options?: CacheRequestOptions): Promise<Headers> {
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

  async getContent(url: string, options?: CacheRequestOptions): Promise<Buffer> {
    return (await this.getContentWithInfo(url, options)).content;
  }

  // Keep bytes, headers and checksum from one stable cache decision. A clear,
  // invalidation or migration can overtake the lookup, even finish before its
  // continuation resumes. A generation check detects that completed operation.
  async getContentWithInfo(
    url: string,
    options: CacheRequestOptions = {},
  ): Promise<CacheContent & { content: Buffer }> {
    const budget = { remaining: normalizeDownloadDuration(options.maxDuration) };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const generation = this.maintenanceGeneration;
      // eslint-disable-next-line no-await-in-loop -- Recheck a decision overtaken by maintenance.
      const cacheInfo = await this.fetchRemoteContent(url, options, budget);
      if (cacheInfo.state === CacheState.ERROR) {
        throw new Error(cacheInfo.error);
      }
      if (cacheInfo.state !== CacheState.CACHED) {
        throw new Error('Url is not cached');
      }
      if (this.maintenance || generation !== this.maintenanceGeneration) {
        // eslint-disable-next-line no-await-in-loop -- Wait outside the drained request/read maps.
        await this.waitForMaintenance();
        // eslint-disable-next-line no-continue -- The completed maintenance invalidated this lookup.
        continue;
      }

      const filePath = this.getCacheFilePath(url);
      // A file another caller cached under a larger cap — a data file that
      // is also the NFT's metadata — is not handed to a caller whose cap it
      // exceeds: the cap is what keeps the renderer from decoding and
      // parsing that much on its thread. The entry stays cached for the
      // callers it fits. The size is taken inside the leased read, so that
      // maintenance waits for it like for the read itself; a file that is
      // gone fails the read, which repairs the entry below.
      const maxSize = normalizeMaxSize(options.maxSize);
      const read = fs.stat(filePath).then(({ size }) => {
        if (size > maxSize) {
          throw new Error(MAX_FILE_SIZE_EXCEEDED_ERROR);
        }
        return fs.readFile(filePath);
      });
      // Register synchronously after the generation check. Maintenance waits
      // for this read before touching its files; eviction also skips the path.
      this.activeReads.set(read, { url, filePath });
      try {
        // eslint-disable-next-line no-await-in-loop -- Read only the stable decision's bytes.
        const content = await read;
        return {
          content,
          headers: cacheInfo.headers,
          checksum: crypto.createHash('sha256').update(content).digest('hex'),
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw this.redactCachePath(error);
        }
      } finally {
        this.activeReads.delete(read);
      }
      // An external deletion or a completed eviction may leave an orphaned
      // sidecar. Drop it before one bounded retry, using the remaining budget.
      // eslint-disable-next-line no-await-in-loop -- Repair the missing entry before retrying.
      await this.invalidate(url);
    }
    throw new Error('Cache changed repeatedly while reading; please retry');
  }

  // Waits out every maintenance operation (clear, migration, invalidation) in
  // progress or queued. A failed operation is its caller's to report; here it
  // only ends the wait.
  private async waitForMaintenance() {
    while (this.maintenance) {
      // eslint-disable-next-line no-await-in-loop -- another operation may have been queued while this one ran
      await this.maintenance.catch(() => {});
    }
  }

  async getChecksum(url: string, options?: CacheRequestOptions): Promise<string> {
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

  async getURI(url: string, options?: CacheRequestOptions) {
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
  //
  // The urls are NFT data the minter wrote, so the batch is bounded here as
  // well as by the caller: a batch over the cap is refused outright, and the
  // lookups within one run a few at a time — each one hashes and validates
  // its url synchronously before its file read, and thousands of those in one
  // go would stall the main process for every window of the wallet.
  async getCacheInfos(urls: string[]): Promise<CacheInfo[]> {
    if (!Array.isArray(urls)) {
      throw new Error('Invalid urls');
    }

    if (urls.length > MAX_CACHE_INFO_LOOKUPS) {
      throw new Error(`Too many urls: ${urls.length} (at most ${MAX_CACHE_INFO_LOOKUPS} per lookup)`);
    }

    const lookupLimit = limit(CACHE_INFO_LOOKUP_CONCURRENCY);

    return Promise.all(
      urls.map((url) =>
        lookupLimit<CacheInfo>(async () => {
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
      ),
    );
  }

  async clearCache() {
    // one clear at a time; a second call joins the one in progress
    if (!this.clearing) {
      this.clearing = this.runMaintenance(() => this.performClear()).finally(() => {
        this.clearing = undefined;
      });
    }

    return this.clearing;
  }

  // Install the barrier before scheduling any work. A failed operation is
  // reported to its caller but must not poison subsequent maintenance/fetches.
  // Invalidation drains only its URL; clear and migration must drain them all.
  private runMaintenance(operation: () => Promise<void>, url?: string): Promise<void> {
    this.maintenanceGeneration += 1;
    const previous = this.maintenance ?? Promise.resolve();
    const pending = previous
      .catch(() => {})
      .then(async () => {
        const ongoing = Array.from(this.ongoingRequests.entries())
          .filter(([requestUrl]) => url === undefined || requestUrl === url)
          .map(([, request]) => request);
        ongoing.forEach((request) => request.abort());
        const reads = Array.from(this.activeReads.entries())
          .filter(([, read]) => url === undefined || read.url === url)
          .map(([read]) => read);
        await Promise.allSettled([...ongoing.map((request) => request.promise), ...reads]);
        await operation();
      });
    this.maintenance = pending;
    return pending.finally(() => {
      if (this.maintenance === pending) {
        this.maintenance = undefined;
      }
    });
  }

  private async performClear() {
    const files = await fs.readdir(this.cacheDirectory);
    const unlinkPromises = files.map(async (file) => {
      const hasSuffix = SUFFIXES.some((suffix) => file.endsWith(suffix));
      if (hasSuffix) {
        const filePath = path.join(this.cacheDirectory, file);
        await safeUnlink(filePath);
      }
    });

    await Promise.all(unlinkPromises);
    // a cleared cache starts every verdict over as well
    this.coldIpfsPaths.clear();
    this.hostCooldowns.clear();

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

    // The picker opens on the current cache directory, so confirming it is the
    // common way to change nothing. Decide that here: the barrier below aborts
    // every download in flight before its operation runs, which is the price
    // of a move, not of a no-op. The check inside the barrier still covers a
    // migration that completes while this one waits its turn.
    if (path.resolve(this.cacheDirectory) === path.resolve(newDirectory)) {
      return;
    }

    await this.runMaintenance(async () => {
      // Resolve the source inside the serialized operation, not before the
      // native picker: another migration may have completed while it was open.
      const oldDirectory = this.cacheDirectory;
      if (path.resolve(oldDirectory) === path.resolve(newDirectory)) {
        return;
      }
      await ensureDirectoryExists(newDirectory);

      // All admitted transfers have settled, including their checksum and
      // sidecar writes. No live temp can be left here and no replacement can
      // start until this operation releases the barrier.
      const files = await fs.readdir(oldDirectory);
      const moved: { file: string; destination: string }[] = [];
      // Every source that was copied, orphans included: the old directory is
      // never looked at again once the destination is published, so anything
      // left there is never counted, evicted or cleared.
      const copiedSources: string[] = [];
      try {
        for (const file of files.filter((name) => isChiaCacheFile(name))) {
          const source = path.join(oldDirectory, file);
          const destination = path.join(newDirectory, file);
          if (isChiaCacheTempFile(file)) {
            // a leftover: nothing in flight is left by now
            // eslint-disable-next-line no-await-in-loop -- Keep migration ordered.
            await safeUnlink(source);
          } else {
            try {
              // eslint-disable-next-line no-await-in-loop -- Keep migration ordered.
              const stat = await fs.lstat(source);
              if (stat.isFile()) {
                // Do not overwrite a pre-existing cache in the destination. Copy
                // first also permits cross-volume migration; remove the source
                // only after the entire copy pass has succeeded.
                // eslint-disable-next-line no-await-in-loop -- Keep migration ordered.
                await fs.copyFile(source, destination, fs.constants.COPYFILE_EXCL);
                moved.push({ file, destination });
                copiedSources.push(source);
              }
            } catch (error) {
              // A source deleted from outside since the listing has nothing
              // to migrate; it must not fail the whole move.
              if ((error as { code?: string }).code !== 'ENOENT') {
                throw error;
              }
            }
          }
        }

        // A data file whose sidecar did not make it across cannot be served
        // (the cache never trusts bytes without their sidecar), so it is not
        // carried over either. The reverse holds for a CACHED sidecar whose
        // data file did not arrive: the cache would trust it and then fail to
        // read the bytes, until the entry is invalidated or the cache cleared.
        // Dropping it lets the next request fetch the entry afresh. Sidecars
        // in any other state stand on their own, as ERROR entries do.
        const movedFiles = new Set(moved.map(({ file }) => file));
        const orphanChecks = await Promise.all(
          moved.map(async (entry) => {
            const { file, destination } = entry;
            if (!isChiaCacheInfoFile(file)) {
              return movedFiles.has(getInfoFilePath(file)) ? undefined : entry;
            }
            if (movedFiles.has(file.slice(0, -INFO_SUFFIX.length))) {
              return undefined;
            }
            return (await isCachedSidecar(destination)) ? entry : undefined;
          }),
        );
        const orphans = orphanChecks.filter((entry): entry is (typeof moved)[number] => entry !== undefined);
        await Promise.all(orphans.map(({ destination }) => safeUnlink(destination)));
        orphans.forEach((orphan) => moved.splice(moved.indexOf(orphan), 1));
      } catch (error) {
        await Promise.all(moved.map(({ destination }) => safeUnlink(destination)));
        throw error;
      }

      // Publish only a complete destination. Failure to unlink an old copy is
      // logged rather than turning a successful copy into a split live entry.
      await Promise.all(
        copiedSources.map(async (source) => {
          try {
            await fs.unlink(source);
          } catch (error) {
            log(`Could not remove migrated cache copy: ${(error as Error).message}`);
          }
        }),
      );
      this.cacheDirectory = newDirectory;
      this.emit('sizeChanged');
    });
  }

  private async trimCache(preserveFilePath: string) {
    try {
      if ((await this.getCacheSize()) > this.maxCacheSize) {
        await this.removeOldestFiles(this.maxCacheSize, preserveFilePath);
      }
    } catch (error) {
      // Housekeeping must not replace the download's saved success or failure.
      log(`Cache housekeeping failed: ${(error as Error).message}`);
    }
    this.emit('sizeChanged');
  }

  private removeOldestFiles(targetSize: number, preserveFilePath?: string): Promise<void> {
    // A burst of completions must not have every scan skip every other entry
    // as still in flight and then leave the directory over quota permanently.
    const pending = this.eviction.catch(() => {}).then(() => this.performEviction(targetSize, preserveFilePath));
    this.eviction = pending;
    return pending;
  }

  private async performEviction(targetSize: number, preserveFilePath?: string): Promise<void> {
    const directory = this.cacheDirectory;
    const files = await fs.readdir(directory);
    const groups = new Map<string, string[]>();
    files.filter(isChiaCacheFile).forEach((file) => {
      const suffix = isChiaCacheInfoFile(file)
        ? file.endsWith(INFO_TEMP_SUFFIX)
          ? INFO_TEMP_SUFFIX
          : INFO_SUFFIX
        : file.endsWith(TEMP_FILE_SUFFIX)
          ? TEMP_FILE_SUFFIX
          : '';
      const filePath = path.join(directory, suffix ? file.slice(0, -suffix.length) : file);
      const members = groups.get(filePath) ?? [];
      members.push(path.join(directory, file));
      groups.set(filePath, members);
    });

    // Count every owned file exactly once, including ERROR-only sidecars and
    // stale sidecar temporaries. Group companions so eviction never leaves a
    // CACHED record behind after deleting its bytes.
    const statLimit = limit(FILE_STAT_CONCURRENCY);
    const fileStats = await Promise.all(
      Array.from(groups, async ([filePath, members]) => {
        const stats = await Promise.all(
          members.map((member) =>
            statLimit<Stats | undefined>(async () => {
              try {
                return await fs.stat(member);
              } catch {
                return undefined;
              }
            }),
          ),
        );
        return {
          filePath,
          members,
          size: stats.reduce((sum, stat) => sum + (stat?.size ?? 0), 0),
          mtime: Math.min(...stats.map((stat) => stat?.mtimeMs ?? Infinity)),
        };
      }),
    );
    fileStats.sort((a, b) => a.mtime - b.mtime);

    const inFlight = this.inFlightTempFilePaths();
    let totalSize = fileStats.reduce((sum, entry) => sum + entry.size, 0);
    const remove: typeof fileStats = [];
    for (const entry of fileStats) {
      if (totalSize <= targetSize) {
        break;
      }
      const beingRead = Array.from(this.activeReads.values()).some((read) => read.filePath === entry.filePath);
      if (entry.filePath !== preserveFilePath && !inFlight.has(`${entry.filePath}${TEMP_FILE_SUFFIX}`) && !beingRead) {
        totalSize -= entry.size;
        remove.push(entry);
      }
    }
    await Promise.all(remove.flatMap(({ members }) => members.map(safeUnlink)));
    this.emit('sizeChanged');
  }

  async invalidate(url: string) {
    if (!isValidURL(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    // Register before the first await so a later migration cannot copy an
    // entry while its deletion is underway. Drain this URL's complete request
    // first: abort cleanup or a late success can still write its sidecar.
    await this.runMaintenance(async () => {
      // An earlier migration may have changed the directory while we waited.
      const filePath = this.getCacheFilePath(url);
      await safeUnlink(filePath);
      await safeUnlink(getInfoFilePath(filePath));
      this.forgetColdIpfsPath(url);

      this.emit('sizeChanged');
    }, url);
  }

  async setMaxCacheSize(maxCacheSize: number | string) {
    this.maxCacheSize = maxCacheSize;
    if (this.maxCacheSize > 0) {
      // eviction deletes files too — see invalidate
      await this.waitForMaintenance();
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
    const statLimit = limit(FILE_STAT_CONCURRENCY);
    const fileSizes = await Promise.all(
      filePaths.map((filePath) =>
        statLimit<number>(async () => {
          try {
            return (await fs.stat(filePath)).size;
          } catch {
            return 0;
          }
        }),
      ),
    );
    const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);

    return totalSize;
  }
}
