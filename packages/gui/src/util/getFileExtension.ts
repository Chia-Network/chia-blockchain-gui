export default function getFileExtension(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  const extension = url.split('.').pop();
  if (extension && extension.indexOf('/') === -1) {
    return extension.toLowerCase();
  }

  return undefined;
}
