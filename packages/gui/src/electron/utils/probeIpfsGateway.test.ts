import { EventEmitter } from 'node:events';

const mockNetRequest = jest.fn();

jest.mock('electron', () => ({
  net: {
    request: mockNetRequest,
  },
}));

const { default: probeIpfsGateway, IPFS_GATEWAY_PROBE_CID } =
  jest.requireActual<typeof import('./probeIpfsGateway')>('./probeIpfsGateway');

type MockRequest = EventEmitter & { end: jest.Mock; abort: jest.Mock; setHeader: jest.Mock };

describe('probeIpfsGateway', () => {
  let request: MockRequest;

  beforeEach(() => {
    mockNetRequest.mockReset();
    request = Object.assign(new EventEmitter(), { end: jest.fn(), abort: jest.fn(), setHeader: jest.fn() });
    mockNetRequest.mockReturnValue(request);
  });

  it('asks the normalized gateway for the empty file without following redirects', async () => {
    const pending = probeIpfsGateway('https://ipfs.example//');
    request.emit('response', { statusCode: 200, headers: {} });

    await expect(pending).resolves.toEqual({
      gateway: 'https://ipfs.example/ipfs/',
      reachable: true,
      status: 200,
    });
    expect(mockNetRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `https://ipfs.example/ipfs/${IPFS_GATEWAY_PROBE_CID}`,
        redirect: 'manual',
      }),
    );
    // the status line was all that was wanted
    expect(request.abort).toHaveBeenCalled();
  });

  it.each([404, 429, 504])('treats an HTTP %s as the gateway answering', async (statusCode) => {
    const pending = probeIpfsGateway('https://ipfs.example');
    request.emit('response', { statusCode, headers: {} });

    await expect(pending).resolves.toMatchObject({ reachable: true, status: statusCode });
  });

  it('treats a redirect as the gateway answering, without following it', async () => {
    const pending = probeIpfsGateway('https://ipfs.example');
    request.emit('redirect', 301, 'GET', 'https://elsewhere.example/', {});

    await expect(pending).resolves.toMatchObject({ reachable: true, status: 301 });
    expect(request.abort).toHaveBeenCalled();
  });

  it('reports the network error when the host cannot be reached', async () => {
    const pending = probeIpfsGateway('https://ipfs.mintgraden.io');
    request.emit('error', new Error('net::ERR_NAME_NOT_RESOLVED'));

    await expect(pending).resolves.toEqual({
      gateway: 'https://ipfs.mintgraden.io/ipfs/',
      reachable: false,
      error: 'net::ERR_NAME_NOT_RESOLVED',
    });
  });

  it('gives up on a gateway that never sends its status line', async () => {
    const pending = probeIpfsGateway('https://ipfs.example', { timeout: 20 });

    await expect(pending).resolves.toMatchObject({ reachable: false, error: 'Request timeout after 20ms' });
    expect(request.abort).toHaveBeenCalled();
  });

  it('settles once: an abort after the answer changes nothing', async () => {
    const pending = probeIpfsGateway('https://ipfs.example');
    request.emit('response', { statusCode: 200, headers: {} });
    request.emit('abort');

    await expect(pending).resolves.toMatchObject({ reachable: true, status: 200 });
  });

  it.each(['not a url', 'http://ipfs.example', 'ftp://ipfs.example', ''])(
    'refuses %p instead of requesting it',
    async (input) => {
      await expect(probeIpfsGateway(input)).rejects.toThrow('Invalid IPFS gateway address');
      expect(mockNetRequest).not.toHaveBeenCalled();
    },
  );
});
