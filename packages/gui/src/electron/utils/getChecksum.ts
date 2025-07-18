import crypto from 'node:crypto';
import fs from 'node:fs';

export default async function getChecksum(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const readStream = fs.createReadStream(filePath);

    readStream.on('data', (chunk) => {
      hash.update(chunk);
    });

    readStream.on('end', () => {
      const checksum = hash.digest('hex');
      resolve(checksum);
    });

    readStream.on('error', (error) => {
      reject(error);
    });
  });
}
