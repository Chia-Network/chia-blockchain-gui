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
