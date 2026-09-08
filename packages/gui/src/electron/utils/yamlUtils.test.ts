import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readData, writeData } from './yamlUtils';

describe('yamlUtils', () => {
  let root: string;
  let file: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'chia-yaml-'));
    file = path.join(root, 'prefs.yaml');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('round-trips an object', () => {
    writeData({ a: 1, nested: { b: 'x' } }, file);
    expect(readData(file)).toEqual({ a: 1, nested: { b: 'x' } });
  });

  it.each([
    ['an empty file', ''],
    ['a document that is null', 'null\n'],
    ['a scalar document', '42\n'],
    ['a list document', '- a\n- b\n'],
    ['unparseable text', 'a: [\n'],
  ])('reads %s as an empty preferences object', (_name, contents) => {
    fs.writeFileSync(file, contents);
    expect(readData(file)).toEqual({});
  });

  it('reads a missing file as an empty preferences object', () => {
    expect(readData(file)).toEqual({});
  });

  it('writes beside the file and renames into place, leaving no temp file behind', () => {
    writeData({ a: 1 }, file);
    writeData({ a: 2 }, file);
    expect(fs.readdirSync(root)).toEqual(['prefs.yaml']);
    expect(readData(file)).toEqual({ a: 2 });
  });

  it('writes even when something else occupies the temp name', () => {
    fs.mkdirSync(`${file}.tmp`);
    fs.writeFileSync(path.join(`${file}.tmp`, 'stray'), 'x');
    writeData({ a: 3 }, file);
    expect(readData(file)).toEqual({ a: 3 });
    expect(fs.readdirSync(root)).toEqual(['prefs.yaml']);
  });
});
