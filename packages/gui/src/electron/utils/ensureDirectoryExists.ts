import fs from 'fs/promises';

import directoryExists from './directoryExists';

export default async function ensureDirectoryExists(dirPath: string) {
  if (!(await directoryExists(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
