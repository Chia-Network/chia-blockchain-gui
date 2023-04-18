import compareAppVersions from './compareAppVersion';

describe('compareAppVersions', () => {
  test('should correctly compare equal versions', () => {
    expect(compareAppVersions('1.0.0', '1.0.0')).toBe(0);
  });

  test('should correctly compare major versions', () => {
    expect(compareAppVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareAppVersions('1.0.0', '2.0.0')).toBe(-1);
  });

  test('should correctly compare minor versions', () => {
    expect(compareAppVersions('1.2.0', '1.1.0')).toBe(1);
    expect(compareAppVersions('1.1.0', '1.2.0')).toBe(-1);
  });

  test('should correctly compare patch versions', () => {
    expect(compareAppVersions('1.0.2', '1.0.1')).toBe(1);
    expect(compareAppVersions('1.0.1', '1.0.2')).toBe(-1);
  });

  test('should correctly compare pre-release versions', () => {
    expect(compareAppVersions('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    expect(compareAppVersions('1.0.0-beta', '1.0.0-alpha')).toBe(1);
  });

  test('should correctly compare pre-release and release versions', () => {
    expect(compareAppVersions('1.0.0', '1.0.0-alpha')).toBe(1);
    expect(compareAppVersions('1.0.0-alpha', '1.0.0')).toBe(-1);
  });

  test('should correctly compare complex version strings', () => {
    expect(compareAppVersions('1.3.6-dev157', '1.7.0b6')).toBe(-1);
    expect(compareAppVersions('1.7.0b6', '1.6.1')).toBe(1);
    expect(compareAppVersions('1.6.1', '1.6.1')).toBe(0);
  });

  test('should throw an error for invalid version strings', () => {
    expect(() => compareAppVersions('1.0.0', '1.0.0.1')).toThrowError('Invalid version string: 1.0.0.1');
    expect(() => compareAppVersions('1.0', '1.0.0')).toThrowError('Invalid version string: 1.0');
    expect(() => compareAppVersions('1.a.0', '1.0.0')).toThrowError('Invalid version string: 1.a.0');
  });
});
