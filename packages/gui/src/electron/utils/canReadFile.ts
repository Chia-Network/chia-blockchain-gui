import fsBase from 'fs';
import fs from 'fs/promises';

export default async function canReadFile(filePath: string) {
  try {
    await fs.access(filePath, fsBase.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}
