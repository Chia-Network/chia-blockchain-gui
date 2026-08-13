const MAX_WALLET_ID_DIGITS = 10;

export function isNumericKey(key: string): boolean {
  return key.length <= MAX_WALLET_ID_DIGITS && /^\d+$/.test(key);
}
