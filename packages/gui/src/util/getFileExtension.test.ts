/// <reference types="jest" />

import getFileExtension from './getFileExtension';

describe('getFileExtension', () => {
  it('returns file extension from valid URLs', () => {
    expect(getFileExtension('https://example.com/test.txt')).toBe('txt');
    expect(getFileExtension('https://example.com/path/image.jpg')).toBe('jpg');
    expect(getFileExtension('file:///home/user/document.pdf')).toBe('pdf');
    expect(getFileExtension('file:///home/user/document.PdF')).toBe('pdf');
  });

  it('handles URLs with query parameters', () => {
    expect(getFileExtension('https://example.com/file.png?size=large')).toBe('png');
    expect(getFileExtension('https://example.com/doc.pdf?version=1&type=draft')).toBe('pdf');
  });

  it('returns undefined for invalid URLs', () => {
    expect(getFileExtension('not-a-url')).toBeUndefined();
    expect(getFileExtension('/local/path/file.txt')).toBeUndefined();
  });

  it('returns undefined for empty or undefined input', () => {
    expect(getFileExtension('')).toBeUndefined();
    expect(getFileExtension(undefined)).toBeUndefined();
  });

  it('returns undefined for URLs without file extensions', () => {
    expect(getFileExtension('https://example.com/README')).toBeUndefined();
    expect(getFileExtension('https://example.com/path/')).toBeUndefined();
  });

  it('handles allowed extensions filter', () => {
    expect(getFileExtension('https://example.com/test.txt', ['txt', 'pdf'])).toBe('txt');
    expect(getFileExtension('https://example.com/test.jpg', ['txt', 'pdf'])).toBeUndefined();
  });

  it('returns undefined for URLs with dot at the end', () => {
    expect(getFileExtension('https://example.com/file.')).toBeUndefined();
  });

  it('returns undefined for URLs starting with dot', () => {
    expect(getFileExtension('https://example.com/.gitignore')).toBeUndefined();
  });

  it('handles path traversal attempts', () => {
    expect(getFileExtension('https://example.com/../secret.txt')).toBe('txt');
    expect(getFileExtension('https://example.com/folder/../file.pdf')).toBe('pdf');
    expect(getFileExtension('https://example.com/./file.jpg')).toBe('jpg');
    expect(getFileExtension('https://example.com/test\\secret.txt')).toBe('txt');
    expect(getFileExtension('https://example.com/test\\..\\secret.txt')).toBe('txt');
    expect(getFileExtension('https://example.com/test/secret.t.xt')).toBe('xt');
    expect(getFileExtension('https://example.com/test/secret.t./xt')).toBeUndefined();
    expect(getFileExtension('https://example.com/test/secret.t/./xt')).toBeUndefined();
    expect(getFileExtension('https://example.com/test/secret.t../xt')).toBeUndefined();
    expect(getFileExtension('https://example.com/test/secret.t/../xt')).toBeUndefined();
    expect(getFileExtension('https://example.com/test/secret.t./xt')).toBeUndefined();
    expect(getFileExtension('https://example.com/test/secret.t/./x..t')).toBe('t');
    expect(getFileExtension('https://example.com/test/secret.t../xt.')).toBeUndefined();
    expect(getFileExtension('https://example.com/test/secret.t/../x.t')).toBe('t');
  });

  it('handles encoded URLs', () => {
    expect(getFileExtension('https://example.com/%2e%2e/file.txt')).toBe('txt');
    expect(getFileExtension('https://example.com/file%2Etxt')).toBe('txt');
    expect(getFileExtension('https://example.com/path%2F..%2Ffile.pdf')).toBe('pdf');
  });

  it('handles special characters in filenames', () => {
    expect(getFileExtension('https://example.com/file with spaces.txt')).toBe('txt');
    expect(getFileExtension('https://example.com/file%20with%20spaces.txt')).toBe('txt');
    expect(getFileExtension('https://example.com/file.txt#fragment')).toBe('txt');
    expect(getFileExtension('https://example.com/file;param=value.txt')).toBe('txt');
  });
});
