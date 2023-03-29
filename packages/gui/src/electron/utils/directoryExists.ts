import fs from 'fs/promises';

export default async function directoryExists(dirPath: string) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}
