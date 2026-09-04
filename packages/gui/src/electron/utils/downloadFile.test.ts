import { EventEmitter } from 'events';
import os from 'node:os';
import path from 'node:path';

const mockNetRequest = jest.fn();

jest.mock('electron', () => ({
  net: {
    request: mockNetRequest,
  },
}));

const { default: downloadFile, isTransientDownloadError } =
  jest.requireActual<typeof import('./downloadFile')>('./downloadFile');

describe('downloadFile', () => {
  beforeEach(() => {
    mockNetRequest.mockReset();
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

    expect(mockNetRequest).toHaveBeenCalledWith('https://gateway.pinata.cloud/ipfs/bafybeigdyrztest/img.png');
    expect(request.setHeader).toHaveBeenCalledWith('User-Agent', expect.stringMatching(/^Chia-Blockchain-GUI\//));
  });

  it('rejects an invalid override URL before requesting anything', async () => {
    await expect(
      downloadFile('https://example.com/img.png', path.join(os.tmpdir(), 'downloadFile-test-bad-override.png'), {
        requestUrl: 'not a url',
      }),
    ).rejects.toThrow('Invalid URL');

    expect(mockNetRequest).not.toHaveBeenCalled();
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

describe('isTransientDownloadError', () => {
  it.each([
    'Request timed out after 30000ms of inactivity',
    'Request exceeded the 1800000ms download deadline',
    'HTTP error: 500',
    'HTTP error: 502',
    'HTTP error: 504',
    'HTTP error: 520',
    'HTTP error: 429',
    'HTTP error: 408',
    // Cloudflare bot challenge in front of the public IPFS gateways
    'HTTP error: 403',
    'net::ERR_BLOCKED_BY_RESPONSE',
    'net::ERR_CONNECTION_RESET',
    'net::ERR_QUIC_PROTOCOL_ERROR',
  ])('treats %p as transient', (message) => {
    expect(isTransientDownloadError(message)).toBe(true);
  });

  it.each([
    'HTTP error: 404',
    'HTTP error: 410',
    'HTTP error: 400',
    'HTTP error: 401',
    'Maximum file size exceeded',
    'Invalid URL',
    'Unknown error',
    'IPFS gateway fetching is disabled',
  ])('treats %p as permanent', (message) => {
    expect(isTransientDownloadError(message)).toBe(false);
  });
});
