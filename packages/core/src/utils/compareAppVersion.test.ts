import compareAppVersions, { parseVersion } from './compareAppVersion';

describe('compareAppVersions', () => {
  // Variable to store the original console.error function
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Store the original console.error function
    originalConsoleError = console.error;
    // Replace console.error with a mocked function to suppress the output
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore the original console.error function after each test
    console.error = originalConsoleError;
  });

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

  test('should return zero for invalid version strings', () => {
    expect(compareAppVersions('1.0.0', '1.0.0.1')).toBe(0);
    expect(compareAppVersions('1.0', '1.0.0')).toBe(0);
    expect(compareAppVersions('1.0.0', '1.a.0')).toBe(0);
  });

  test('should throw an error for invalid version strings', () => {
    expect(() => parseVersion('1.0.0.1')).toThrowError('Invalid version string: 1.0.0.1');
    expect(() => parseVersion('1.0')).toThrowError('Invalid version string: 1.0');
    expect(() => parseVersion('1.a.0')).toThrowError('Invalid version string: 1.a.0');
  });
});
