import mime from 'mime-types';

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

export function stripHexPrefix(hexString) {
  if (hexString.startsWith('0x') || hexString.startsWith('0X')) {
    return hexString.slice(2);
  }
  return hexString;
}

export function arrToHex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2)).join('');
}

export async function sha256(buf) {
  return window.crypto.subtle.digest('SHA-256', new Uint8Array(buf));
}

export function mimeTypeRegex(uri, regexp) {
  let urlOnly = '';
  try {
    urlOnly = new URL(uri).origin + new URL(uri).pathname;
  } catch (e) {
    console.error(`Error parsing URL ${uri}: ${e}`);
  }
  const temp = mime.lookup(urlOnly);
  return (temp || '').match(regexp);
}

export function isImage(uri) {
  return !!(mimeTypeRegex(uri || '', /^image/) || mimeTypeRegex(uri || '', /^$/));
}

export function getCacheInstances() {
  return Object.keys(localStorage)
    .filter((key) => key.indexOf('content-cache-') > -1 || key.indexOf('thumb-cache-') > -1)
    .map((key) => JSON.parse(localStorage[key]))
    .sort((a, b) => (a.time > b.time ? -1 : 1));
}

export function removeFromLocalStorage({ removedObjects }) {
  if (Array.isArray(removedObjects)) {
    removedObjects.forEach((obj) => {
      Object.keys(localStorage)
        .filter((key) => key.indexOf('content-cache-') === 0 || key.indexOf('thumb-cache-') === 0)
        .forEach((key) => {
          try {
            const entry = JSON.parse(localStorage.getItem(key));
            if (
              (!!obj.video && obj.video === entry.video) ||
              (!!obj.image && obj.image === entry.image) ||
              (!!obj.binary && obj.binary === entry.binary)
            ) {
              delete entry.video;
              delete entry.image;
              delete entry.binary;
              localStorage.setItem(key, JSON.stringify(entry));
            }
          } catch (e) {
            console.error(e.message);
          }
        });
    });
  }
}

export function parseExtensionFromUrl(url) {
  return url.indexOf('.') > -1 ? url.split('.').slice(-1)[0].toLowerCase() : null;
}

export function toBase64Safe(url) {
  return Buffer.from(url).toString('base64').replace(/\//g, '_').replace(/\+/, '-');
}

export function fromBase64Safe(base64String) {
  return Buffer.from(base64String.replace(/_/g, '/').replace(/-/, '+'), 'base64');
}

export function isDocument(extension) {
  return ['pdf', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].indexOf(extension) > -1;
}

export function getNFTFileType(nft) {
  const file = Array.isArray(nft.dataUris) && nft.dataUris[0];
  try {
    const extension = new URL(file).pathname.split('.').slice(-1)[0];
    if (extension.match(/^[a-zA-Z0-9]+$/) && isDocument(extension)) {
      return 'Document';
    }
  } catch (e) {
    // do nothing
  }
  return isImage(file)
    ? 'Image'
    : mimeTypeRegex(file, /^audio/)
    ? 'Audio'
    : mimeTypeRegex(file, /^video/)
    ? 'Video'
    : mimeTypeRegex(file, /^model/)
    ? 'Model'
    : 'Unknown';
}

export function isMac() {
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}
