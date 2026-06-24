export function normalizeHex(hex: string): string {
  return hex.toLowerCase().replace(/^0x/, '');
}
