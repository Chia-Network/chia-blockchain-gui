import isURL from 'validator/lib/isURL';

export default function isValidURL(url: string) {
  if (typeof url !== 'string') {
    return false;
  }

  return isURL(url, { protocols: ['https', 'ipfs'], require_protocol: true });
}
