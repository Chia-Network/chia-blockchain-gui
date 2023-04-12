import crypto from 'crypto';
import fs from 'fs/promises';

export default async function getChecksum(filePath: string) {
  const data = await fs.readFile(filePath);

  const hash = crypto.createHash('sha256');
  hash.update(data);

  return hash.digest('hex');
}
