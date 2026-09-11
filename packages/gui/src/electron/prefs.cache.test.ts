import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const mockUserDataDir = jest.fn();
jest.mock('./utils/userData', () => ({ getUserDataDir: () => mockUserDataDir() }));

const { readPrefs, savePrefs } = jest.requireActual<typeof import('./prefs')>('./prefs');

describe('preference read cache', () => {
  let directory: string;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chia-prefs-'));
    mockUserDataDir.mockReturnValue(directory);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('reuses unchanged YAML without sharing mutable preference objects', () => {
    savePrefs({ nftIpfsGateway: true, nested: { value: 'original' } });
    const read = jest.spyOn(fs, 'readFileSync');
    const first = readPrefs();
    first.nested.value = 'modified';
    expect(readPrefs()).toEqual({ nftIpfsGateway: true, nested: { value: 'original' } });
    expect(read.mock.calls.filter(([file]) => file === path.join(directory, 'prefs.yaml'))).toHaveLength(1);
  });

  it('observes saves and external atomic replacement immediately', () => {
    savePrefs({ nftIpfsGateway: true });
    expect(readPrefs().nftIpfsGateway).toBe(true);
    savePrefs({ nftIpfsGateway: false });
    expect(readPrefs().nftIpfsGateway).toBe(false);
    const replacement = path.join(directory, 'replacement.yaml');
    fs.writeFileSync(replacement, 'nftIpfsGateway: true\n');
    fs.renameSync(replacement, path.join(directory, 'prefs.yaml'));
    expect(readPrefs().nftIpfsGateway).toBe(true);
  });

  it('does not retain an enabled gateway after the preferences disappear', () => {
    savePrefs({ nftIpfsGateway: true });
    expect(readPrefs().nftIpfsGateway).toBe(true);
    fs.unlinkSync(path.join(directory, 'prefs.yaml'));
    expect(readPrefs()).toEqual({});
  });
});
