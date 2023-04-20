export default function removeHexPrefix(hex: string) {
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    return hex.slice(2);
  }
  return hex;
}
