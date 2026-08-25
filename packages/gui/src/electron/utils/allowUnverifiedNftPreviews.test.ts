const mockReadPrefs = jest.fn<Record<string, any>, []>();

jest.mock('../prefs', () => ({
  readPrefs: mockReadPrefs,
}));

const { default: allowUnverifiedNftPreviews, NFT_ALLOW_UNVERIFIED_PREVIEWS_PREF } =
  jest.requireActual<typeof import('./allowUnverifiedNftPreviews')>('./allowUnverifiedNftPreviews');

describe('allowUnverifiedNftPreviews', () => {
  beforeEach(() => {
    mockReadPrefs.mockReset();
  });

  it('is disabled when the preference has never been set', () => {
    mockReadPrefs.mockReturnValue({});

    expect(allowUnverifiedNftPreviews()).toBe(false);
  });

  it('is enabled only by an explicit boolean true', () => {
    mockReadPrefs.mockReturnValue({ [NFT_ALLOW_UNVERIFIED_PREVIEWS_PREF]: true });
    expect(allowUnverifiedNftPreviews()).toBe(true);

    mockReadPrefs.mockReturnValue({ [NFT_ALLOW_UNVERIFIED_PREVIEWS_PREF]: 'true' });
    expect(allowUnverifiedNftPreviews()).toBe(false);
  });

  it('fails closed when the preferences store cannot be read', () => {
    mockReadPrefs.mockImplementation(() => {
      throw new Error('userDataDir needs to be initialized');
    });

    expect(allowUnverifiedNftPreviews()).toBe(false);
  });
});
