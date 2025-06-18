import isURL from 'validator/lib/isURL';

export default function isValidURL(url: string) {
  return isURL(url, { protocols: ['http', 'https', 'ipfs'], require_protocol: true });
}
