export default function removeHexPrefix(hex: string) {
  return hex.replace(/^0x/, '');
}
