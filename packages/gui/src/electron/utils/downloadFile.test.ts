import os from 'node:os';
import path from 'node:path';

const mockNetRequest = jest.fn();

jest.mock('electron', () => ({
  net: {
    request: mockNetRequest,
  },
}));

const downloadFile = jest.requireActual<typeof import('./downloadFile')>('./downloadFile').default;

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
