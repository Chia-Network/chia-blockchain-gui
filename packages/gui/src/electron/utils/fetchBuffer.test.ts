import { EventEmitter } from 'node:events';

const mockNetRequest = jest.fn();

jest.mock('electron', () => ({
  net: {
    request: mockNetRequest,
  },
}));

const { default: fetchBuffer, MaxSizeExceededError } =
  jest.requireActual<typeof import('./fetchBuffer')>('./fetchBuffer');

type MockRequest = EventEmitter & {
  abort: jest.Mock;
  end: jest.Mock;
  setHeader: jest.Mock;
};

type MockResponse = EventEmitter & {
  statusCode: number;
  headers: Record<string, string | string[]>;
};

function makeResponse(statusCode: number = 200, headers: Record<string, string | string[]> = {}): MockResponse {
  return Object.assign(new EventEmitter(), {
    statusCode,
    headers,
  });
}

describe('fetchBuffer', () => {
  let request: MockRequest;

  beforeEach(() => {
    mockNetRequest.mockReset();
    request = Object.assign(new EventEmitter(), {
      abort: jest.fn(),
      end: jest.fn(),
      setHeader: jest.fn(),
    });
    request.abort.mockImplementation(() => {
      request.emit('abort');
    });
    mockNetRequest.mockReturnValue(request);
  });

  it('identifies itself as the application rather than a browser', async () => {
    const resultPromise = fetchBuffer('https://example.com/metadata.json');
    const response = makeResponse();
    request.emit('response', response);
    response.emit('end');
    await resultPromise;

    expect(request.setHeader).toHaveBeenCalledWith('User-Agent', expect.stringMatching(/^Chia-Blockchain-GUI\//));
  });

  it('returns response bytes and headers', async () => {
    const resultPromise = fetchBuffer('https://example.com/image.png', {
      maxSize: 1024,
    });
    const response = makeResponse(200, {
      'content-type': 'image/png',
    });

    request.emit('response', response);
    response.emit('data', Buffer.from('first'));
    response.emit('data', Buffer.from(' second'));
    response.emit('end');

    await expect(resultPromise).resolves.toEqual({
      data: Buffer.from('first second'),
      headers: {
        'content-type': 'image/png',
      },
    });
    expect(request.end).toHaveBeenCalledWith();
  });

  it('rejects an oversized response from its content-length header with the response headers', async () => {
    const resultPromise = fetchBuffer('https://example.com/image.png', {
      maxSize: 10,
    });

    request.emit(
      'response',
      makeResponse(200, {
        'content-length': '11',
        'content-type': 'image/gif',
      }),
    );

    await expect(resultPromise).rejects.toThrow(MaxSizeExceededError);
    await expect(resultPromise).rejects.toMatchObject({
      headers: {
        'content-length': '11',
        'content-type': 'image/gif',
      },
    });
    expect(request.abort).toHaveBeenCalledWith();
  });

  it('rejects an oversized streamed response without a content-length header', async () => {
    const resultPromise = fetchBuffer('https://example.com/image.png', {
      maxSize: 10,
    });
    const response = makeResponse(200, {
      'content-type': 'image/gif',
    });

    request.emit('response', response);
    response.emit('data', Buffer.alloc(11));

    await expect(resultPromise).rejects.toThrow(MaxSizeExceededError);
    await expect(resultPromise).rejects.toMatchObject({
      headers: {
        'content-type': 'image/gif',
      },
    });
    expect(request.abort).toHaveBeenCalledWith();
  });
});
