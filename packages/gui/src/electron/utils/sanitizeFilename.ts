import sanitizeFilenameOG from 'sanitize-filename';

export default function sanitizeFilename(filename: string) {
  const sanitizedFileName = sanitizeFilenameOG(filename);
  if (sanitizedFileName !== filename) {
    throw new Error(`Invalid filename: ${filename}`);
  }

  return sanitizedFileName;
}
