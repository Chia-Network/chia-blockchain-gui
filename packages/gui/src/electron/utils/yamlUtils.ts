import fs from 'node:fs';

import { dump, load } from 'js-yaml';

export function readData(path: string): Record<string, any> {
  try {
    if (!fs.existsSync(path)) {
      return {};
    }

    const yamlData = fs.readFileSync(path, 'utf-8');
    // An empty file loads as undefined and a scalar document as itself;
    // callers index into the result, so anything but an object is nothing.
    const parsed = load(yamlData);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, any>)
      : {};
  } catch (e) {
    console.warn(e);
    return {};
  }
}

export function writeData(data: Record<string, any>, path: string): void {
  try {
    if (!data) {
      return;
    }
    const yamlData = dump(data);
    // Written beside the file and renamed into place: a crash mid-write
    // leaves the previous file intact instead of an empty or truncated one.
    const tempPath = `${path}.tmp`;
    // whatever is at the temp name — a leftover, a directory — is in the way
    fs.rmSync(tempPath, { recursive: true, force: true });
    fs.writeFileSync(tempPath, yamlData, { encoding: 'utf-8' });
    fs.renameSync(tempPath, path);
  } catch (e) {
    console.warn(e);
  }
}
