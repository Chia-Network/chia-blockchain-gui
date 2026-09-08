import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const mockNetRequest = jest.fn();
const mockReadPrefs = jest.fn<Record<string, any>, []>();

jest.mock('electron', () => ({
  net: {
    request: mockNetRequest,
  },
}));

jest.mock('../prefs', () => ({
  readPrefs: mockReadPrefs,
}));

const {
  default: downloadFile,
  isTransientDownloadError,
  normalizeMaxSize,
  normalizeTimeout,
  DEFAULT_MAX_FILE_SIZE,
  MAX_FILE_SIZE_CEILING,
  DEFAULT_INACTIVITY_TIMEOUT,
  DEFAULT_DOWNLOAD_MAX_DURATION,
} = jest.requireActual<typeof import('./downloadFile')>('./downloadFile');
const { NFT_IPFS_GATEWAY_PREF } = jest.requireActual<typeof import('./ipfsGateway')>('./ipfsGateway');

const CID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

// a request that answers every call with a 404, so the download settles
// without touching the network or the disk
function make404Request() {
  const request = Object.assign(new EventEmitter(), {
    abort: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(() => {
      const response = Object.assign(new EventEmitter(), { statusCode: 404, headers: {} });
      request.emit('response', response);
    }),
  });
  request.abort.mockImplementation(() => request.emit('abort'));
  return request;
}

describe('downloadFile', () => {
  beforeEach(() => {
    mockNetRequest.mockReset();
    mockReadPrefs.mockReset();
    mockReadPrefs.mockReturnValue({ [NFT_IPFS_GATEWAY_PREF]: true });
  });

  it('requests an ipfs URI through a local plain-http gateway, the form the gateway setting allows', async () => {
    mockNetRequest.mockReturnValue(make404Request());

    await expect(
      downloadFile(`ipfs://${CID}/img.png`, path.join(os.tmpdir(), 'downloadFile-test-local-gateway.png'), {
        gatewayBase: 'http://127.0.0.1:8080/ipfs/',
      }),
    ).rejects.toThrow('HTTP error: 404');

    expect(mockNetRequest).toHaveBeenCalledWith({
      url: `http://127.0.0.1:8080/ipfs/${CID}/img.png`,
      redirect: 'manual',
    });
  });

  // The URL that leaves the machine is the gateway form, not the ipfs URI the
  // structural check saw — so it is validated on its own before the request.
  it('does not request a gateway URL that fails validation', async () => {
    await expect(
      downloadFile(`ipfs://${CID}/img.png`, path.join(os.tmpdir(), 'downloadFile-test-bad-gateway.png'), {
        gatewayBase: 'http://192.168.1.10:8080/ipfs/',
      }),
    ).rejects.toThrow('Invalid URL');

    expect(mockNetRequest).not.toHaveBeenCalled();
  });

  it('does not request an ipfs URI whose path leaves the gateway prefix', async () => {
    await expect(
      downloadFile('ipfs://../../admin', path.join(os.tmpdir(), 'downloadFile-test-traversal.png'), {
        gatewayBase: 'http://127.0.0.1:8080/ipfs/',
      }),
    ).rejects.toThrow('Invalid URL');

    expect(mockNetRequest).not.toHaveBeenCalled();
  });

  it('requests the override URL, identified as the application, while keeping the cache key', async () => {
    const request = Object.assign(new EventEmitter(), {
      abort: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn(() => {
        const response = Object.assign(new EventEmitter(), { statusCode: 404, headers: {} });
        request.emit('response', response);
      }),
    });
    request.abort.mockImplementation(() => request.emit('abort'));
    mockNetRequest.mockReturnValue(request);

    await expect(
      downloadFile(
        'https://nftstorage.link/ipfs/bafybeigdyrztest/img.png',
        path.join(os.tmpdir(), 'downloadFile-test-override.png'),
        { requestUrl: 'https://gateway.pinata.cloud/ipfs/bafybeigdyrztest/img.png' },
      ),
    ).rejects.toThrow('HTTP error: 404');

    expect(mockNetRequest).toHaveBeenCalledWith({
      url: 'https://gateway.pinata.cloud/ipfs/bafybeigdyrztest/img.png',
      redirect: 'manual',
    });
    expect(request.setHeader).toHaveBeenCalledWith('User-Agent', expect.stringMatching(/^Chia-Blockchain-GUI\//));
  });

  it('accepts a plain-http override on this machine, the form a local gateway takes', async () => {
    const request = Object.assign(new EventEmitter(), {
      abort: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn(() => {
        const response = Object.assign(new EventEmitter(), { statusCode: 404, headers: {} });
        request.emit('response', response);
      }),
    });
    request.abort.mockImplementation(() => request.emit('abort'));
    mockNetRequest.mockReturnValue(request);

    await expect(
      downloadFile(
        'https://nftstorage.link/ipfs/bafybeigdyrztest/img.png',
        path.join(os.tmpdir(), 'downloadFile-test-local-override.png'),
        { requestUrl: 'http://127.0.0.1:8080/ipfs/bafybeigdyrztest/img.png' },
      ),
    ).rejects.toThrow('HTTP error: 404');

    expect(mockNetRequest).toHaveBeenCalledWith({
      url: 'http://127.0.0.1:8080/ipfs/bafybeigdyrztest/img.png',
      redirect: 'manual',
    });
  });

  it('rejects an invalid override URL before requesting anything', async () => {
    await expect(
      downloadFile('https://example.com/img.png', path.join(os.tmpdir(), 'downloadFile-test-bad-override.png'), {
        requestUrl: 'not a url',
      }),
    ).rejects.toThrow('Invalid URL');

    expect(mockNetRequest).not.toHaveBeenCalled();
  });

  it('still settles when its temp file was removed from under it', async () => {
    const localPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'downloadFile-test-')), 'nft.png');
    const response = Object.assign(new EventEmitter(), { statusCode: 200, headers: {} });
    const request = Object.assign(new EventEmitter(), {
      abort: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn(() => request.emit('response', response)),
    });
    mockNetRequest.mockReturnValue(request);

    const pending = downloadFile('https://example.com/nft.png', localPath);
    // let the write stream open (and so create) the temp file, then take it
    // away the way "Clear cache" would, and abort the transfer
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    await fs.rm(`${localPath}.tmp`, { force: true });
    response.emit('aborted');

    await expect(pending).rejects.toThrow('Response aborted');
  });

  it('does not start a transfer whose signal was aborted while queued', async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      downloadFile('https://example.com/nft.png', path.join(os.tmpdir(), 'downloadFile-test-nft.png'), {
        signal: abortController.signal,
      }),
    ).rejects.toThrow('Request aborted');

    expect(mockNetRequest).not.toHaveBeenCalled();
  });
});

describe('downloadFile redirects', () => {
  type MockRequest = EventEmitter & { end: jest.Mock; abort: jest.Mock; followRedirect: jest.Mock };
  let request: MockRequest;

  function makeResponse(statusCode = 200, headers: Record<string, string> = { 'content-type': 'image/png' }) {
    return Object.assign(new EventEmitter(), { statusCode, headers });
  }

  beforeEach(() => {
    request = Object.assign(new EventEmitter(), {
      end: jest.fn(),
      abort: jest.fn(),
      followRedirect: jest.fn(),
      setHeader: jest.fn(),
    });
    request.abort.mockImplementation(() => {
      request.emit('abort');
    });
    mockNetRequest.mockReturnValue(request);
  });

  it('asks for manual redirects and follows one that stays on https', async () => {
    const localPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'downloadFile-redirect-')), 'nft.png');
    const download = downloadFile('https://minter.example/a.png', localPath);
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    expect(mockNetRequest).toHaveBeenCalledWith({ url: 'https://minter.example/a.png', redirect: 'manual' });

    request.emit('redirect', 302, 'GET', 'https://cdn.example/a.png', {});
    expect(request.followRedirect).toHaveBeenCalledTimes(1);

    const response = makeResponse();
    request.emit('response', response);
    response.emit('data', Buffer.from('png bytes'));
    response.emit('end');

    await expect(download).resolves.toEqual({ 'content-type': 'image/png' });
    expect((await fs.readFile(localPath)).toString()).toBe('png bytes');
  });

  it('refuses a redirect to a plain-http loopback address and settles permanently', async () => {
    const localPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'downloadFile-redirect-')), 'nft.png');
    const download = downloadFile('https://minter.example/a.png', localPath);
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    request.emit('redirect', 302, 'GET', 'http://127.0.0.1:8080/api/v0/shutdown', {});
    expect(request.followRedirect).not.toHaveBeenCalled();
    expect(request.abort).toHaveBeenCalled();

    await expect(download).rejects.toThrow('Redirect refused');
    expect(isTransientDownloadError('Redirect refused')).toBe(false);
    await expect(fs.stat(`${localPath}.tmp`)).rejects.toThrow();
  });
});

describe('isTransientDownloadError', () => {
  it.each([
    'Request timed out after 30000ms of inactivity',
    'Request exceeded the 1800000ms download deadline',
    'HTTP error: 500',
    'HTTP error: 502',
    'HTTP error: 503',
    'HTTP error: 504',
    'HTTP error: 507',
    'HTTP error: 520',
    'HTTP error: 522',
    'HTTP error: 429',
    'HTTP error: 408',
    // Cloudflare bot challenge in front of the public IPFS gateways
    'HTTP error: 403',
    'net::ERR_BLOCKED_BY_RESPONSE',
    'net::ERR_CONNECTION_RESET',
    'net::ERR_CONNECTION_REFUSED',
    'net::ERR_QUIC_PROTOCOL_ERROR',
    'net::ERR_HTTP2_PROTOCOL_ERROR',
    'net::ERR_INTERNET_DISCONNECTED',
    // offline, or a resolver hiccup, as often as a name that does not exist
    'net::ERR_NAME_NOT_RESOLVED',
    'net::ERR_NAME_RESOLUTION_FAILED',
    // an unknown network error keeps the benefit of the doubt
    'net::ERR_SOMETHING_NEW',
    // this machine's own trouble, not the host's
    'EMFILE: cache file operation failed',
    'ENOSPC: no space left on device, write',
    'EBUSY: resource busy or locked, rename',
  ])('treats %p as transient', (message) => {
    expect(isTransientDownloadError(message)).toBe(true);
  });

  it.each([
    'HTTP error: 404',
    'HTTP error: 410',
    'HTTP error: 400',
    'HTTP error: 401',
    // the host does not implement the request or the protocol
    'HTTP error: 501',
    'HTTP error: 505',
    'Maximum file size exceeded',
    'Invalid URL',
    'Unknown error',
    'EACCES: cache file operation failed',
    'ENOENT: no such file or directory',
    'IPFS gateway fetching is disabled',
  ])('treats %p as permanent', (message) => {
    expect(isTransientDownloadError(message)).toBe(false);
  });

  // Every URL that reaches this predicate was written by the NFT's minter, and
  // a "transient" verdict re-probes it for as long as the wallet is open —
  // a failure that is a property of the URL must settle instead.
  it.each([
    'net::ERR_CERT_AUTHORITY_INVALID',
    'net::ERR_CERT_DATE_INVALID',
    'net::ERR_CERT_COMMON_NAME_INVALID',
    'net::ERR_UNSAFE_PORT',
    'net::ERR_DISALLOWED_URL_SCHEME',
    'net::ERR_UNKNOWN_URL_SCHEME',
    'net::ERR_INVALID_URL',
    'net::ERR_BLOCKED_BY_CLIENT',
    'net::ERR_INVALID_REDIRECT',
    'net::ERR_TOO_MANY_REDIRECTS',
  ])('treats the network error %p as permanent', (message) => {
    expect(isTransientDownloadError(message)).toBe(false);
  });
});

describe('normalizeMaxSize', () => {
  it.each([
    [undefined, DEFAULT_MAX_FILE_SIZE],
    [Number.NaN, DEFAULT_MAX_FILE_SIZE],
    ['10' as unknown as number, DEFAULT_MAX_FILE_SIZE],
    [{} as unknown as number, DEFAULT_MAX_FILE_SIZE],
    // "no limit" is the ceiling, never unbounded
    [-1, MAX_FILE_SIZE_CEILING],
    [0, MAX_FILE_SIZE_CEILING],
    [Number.POSITIVE_INFINITY, MAX_FILE_SIZE_CEILING],
    [MAX_FILE_SIZE_CEILING * 4, MAX_FILE_SIZE_CEILING],
    [5 * 1024 * 1024, 5 * 1024 * 1024],
    [1234.9, 1234],
  ])('turns %p into %p', (value, expected) => {
    expect(normalizeMaxSize(value)).toBe(expected);
  });
});

describe('normalizeTimeout', () => {
  it.each([
    [undefined, DEFAULT_INACTIVITY_TIMEOUT],
    [Number.NaN, DEFAULT_INACTIVITY_TIMEOUT],
    [0, DEFAULT_INACTIVITY_TIMEOUT],
    [-5, DEFAULT_INACTIVITY_TIMEOUT],
    ['10' as unknown as number, DEFAULT_INACTIVITY_TIMEOUT],
    [Number.POSITIVE_INFINITY, DEFAULT_INACTIVITY_TIMEOUT],
    // beyond what a timer can represent: clamped, never overflowing to ~1 ms
    [1e12, DEFAULT_DOWNLOAD_MAX_DURATION],
    [10_000, 10_000],
    [0.5, 1],
  ])('turns %p into %p', (value, expected) => {
    expect(normalizeTimeout(value)).toBe(expected);
  });
});
