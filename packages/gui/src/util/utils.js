const IMAGE_EXTENSIONS = new Set(['apng', 'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'tif', 'tiff', 'webp']);

function getExtension(uri) {
  if (!uri) {
    return undefined;
  }

  try {
    const url = new URL(uri);
    const pathname = decodeURIComponent(url.pathname);
    const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === lastSegment.length - 1) {
      return undefined;
    }

    return lastSegment.substring(dotIndex + 1).toLowerCase();
  } catch (e) {
    const dotIndex = uri.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === uri.length - 1) {
      return undefined;
    }
    return uri.substring(dotIndex + 1).toLowerCase();
  }
}

export function hexToArray(hexStringParam) {
  let hexString = hexStringParam;
  if (hexString.slice(0, 2) === '0x' || hexString.slice(0, 2) === '0X') {
    hexString = hexString.slice(2);
  }
  const arr = [];
  for (let i = 0; i < hexString.length; i += 2) {
    arr.push(Number.parseInt(hexString.substr(i, 2), 16));
  }
  return arr;
}

export function arrToHex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2)).join('');
}

export async function sha256(buf) {
  return window.crypto.subtle.digest('SHA-256', new Uint8Array(buf));
}

export function mimeTypeRegex(uri, regexp) {
  const extension = getExtension(uri);
  if (!extension) {
    return ''.match(regexp);
  }

  const mimeType = IMAGE_EXTENSIONS.has(extension) ? 'image' : '';
  return mimeType.match(regexp);
}

export function isImage(uri) {
  return !!(mimeTypeRegex(uri || '', /^image/) || mimeTypeRegex(uri || '', /^$/));
}

export function isDocument(extension) {
  return ['pdf', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].indexOf(extension) !== -1;
}

export function isMac() {
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}
