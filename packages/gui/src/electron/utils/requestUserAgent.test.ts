const mockGetVersion = jest.fn<string, []>();

jest.mock('electron', () => ({
  app: {
    getVersion: () => mockGetVersion(),
  },
}));

const getRequestUserAgent = jest.requireActual<typeof import('./requestUserAgent')>('./requestUserAgent').default;

describe('getRequestUserAgent', () => {
  beforeEach(() => {
    mockGetVersion.mockReset();
  });

  it('identifies the application and its version, not a browser', () => {
    mockGetVersion.mockReturnValue('2.7.4');

    expect(getRequestUserAgent()).toBe('Chia-Blockchain-GUI/2.7.4');
  });

  it('still identifies the application when the version is unavailable', () => {
    mockGetVersion.mockImplementation(() => {
      throw new Error('app is not ready');
    });

    expect(getRequestUserAgent()).toBe('Chia-Blockchain-GUI/unknown');
  });
});
