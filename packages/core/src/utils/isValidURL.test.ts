import isValidURL from './isValidURL';

describe('isValidURL', () => {
  test('returns true for a valid URL', () => {
    const url = 'https://example.com';
    expect(isValidURL(url)).toBe(true);
  });

  test('returns true for a valid URL with an encoded space', () => {
    const url = 'https://example.com/foo%20bar';
    expect(isValidURL(url)).toBe(true);
  });

  test('returns true for a valid URL with an unencoded space', () => {
    const url = 'https://example.com/foo bar';
    expect(isValidURL(url)).toBe(true);
  });

  test('returns false for an invalid URL', () => {
    const url = 'not a valid URL';
    expect(isValidURL(url)).toBe(false);
  });

  test('returns false for a URL with an invalid hostname', () => {
    const url = 'https://example';
    expect(isValidURL(url)).toBe(false);
  });

  test('returns false for a URL with an invalid port', () => {
    const url = 'https://example.com:abc';
    expect(isValidURL(url)).toBe(false);
  });

  test('returns true for a valid URL with options', () => {
    const url = 'https://example.com';
    const options = {
      protocols: ['https'],
      require_tld: true,
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
    };
    expect(isValidURL(url, options)).toBe(true);
  });

  test('returns false for a URL with an invalid protocol', () => {
    const url = 'https://example.com';
    const options = {
      protocols: ['ftp'],
    };
    expect(isValidURL(url, options)).toBe(false);
  });

  test('returns false if decoding fails and URL is invalid', () => {
    // mock decodeURI to throw an error
    const { decodeURI } = global;
    global.decodeURI = () => {
      throw new Error('mock error');
    };

    const url = 'https://example.com/foo bar';
    expect(isValidURL(url)).toBe(false);

    // restore decodeURI
    global.decodeURI = decodeURI;
  });
});
