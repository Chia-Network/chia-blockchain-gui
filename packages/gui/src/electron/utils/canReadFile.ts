import fsBase from 'node:fs';
import fs from 'node:fs/promises';

export default async function canReadFile(filePath: string) {
  try {
    await fs.access(filePath, fsBase.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}
