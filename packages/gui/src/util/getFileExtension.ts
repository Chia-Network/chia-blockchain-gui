export default function getFileExtension(url?: string, allowedExtensions?: string[]): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const urlObj = new URL(url);
    const pathname = decodeURIComponent(urlObj.pathname);

    const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (!lastSegment || lastSegment.startsWith('.')) {
      return undefined;
    }

    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === lastSegment.length - 1) {
      return undefined;
    }

    const extension = lastSegment.substring(dotIndex + 1).toLowerCase();
    if (allowedExtensions && !allowedExtensions.includes(extension)) {
      return undefined;
    }

    return extension;
  } catch (e) {
    return undefined;
  }
}
