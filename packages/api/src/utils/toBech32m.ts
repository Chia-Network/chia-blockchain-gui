import { bech32m } from 'bech32';

export function removePrefix(value: string, prefix: string): string {
  if (value.startsWith(prefix)) {
    return value.slice(prefix.length);
  }

  return value;
}

export default function toBech32m(value: string, prefix: string): string {
  if (value.startsWith(prefix)) {
    return value;
  }

  const pureHash = removePrefix(value, '0x');
  const hexBytes = Buffer.from(pureHash, 'hex');

  if (pureHash.length / 2 !== hexBytes.length) {
    throw new Error('Invalid hex string');
  }

  const words = bech32m.toWords(hexBytes);

  return bech32m.encode(prefix, words);
}

export function fromBech32m(value: string): string {
  const data = bech32m.decode(value);
  return Buffer.from(bech32m.fromWords(data.words)).toString('hex');
}

export function decodeBech32m(
  value: string,
  outputEncoding: BufferEncoding = 'utf8'
): { prefix: string; data: string } {
  const { words, prefix } = bech32m.decode(value);
  const data = Buffer.from(bech32m.fromWords(words)).toString(outputEncoding);

  return { prefix, data };
}
