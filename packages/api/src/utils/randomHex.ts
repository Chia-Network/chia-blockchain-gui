function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function randomHex(size: number): string {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error('Web Crypto API is not available');
  }

  const data = new Uint8Array(size);
  cryptoObj.getRandomValues(data);
  return bytesToHex(data);
}
