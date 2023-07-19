import fs from 'fs';

import { dump, load } from 'js-yaml';

export function readData(path: string): Record<string, any> {
  try {
    if (!fs.existsSync(path)) {
      return {};
    }

    const yamlData = fs.readFileSync(path, 'utf-8');
    return load(yamlData) as Record<string, any>;
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
    fs.writeFileSync(path, yamlData, { encoding: 'utf-8' });
  } catch (e) {
    console.warn(e);
  }
}
