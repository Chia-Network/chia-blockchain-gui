import isURL from 'validator/lib/isURL';
import type { IsURLOptions } from 'validator/lib/isURL';

function isValidURL(url: string, options?: IsURLOptions): boolean {
  let normalizedURL;

  try {
    // isURL returns false for URLs with unencoded spaces. We can't use
    // encodeURI if the URL is already encoded, so we attempt to decode
    // the URL first and then encode it if it wasn't already encoded.

    normalizedURL = decodeURI(url) === url ? encodeURI(url) : url;
  } catch (e) {
    // URL wasn't properly encoded
    return isURL(url, options);
  }

  return isURL(normalizedURL, options);
}

export default isValidURL;
