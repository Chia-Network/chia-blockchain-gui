/**
 * Normalize a hex string by removing the '0x' prefix and converting to lowercase.
 *
 * This is needed because chia-blockchain 2.5.7+ returns bytes32 fields with '0x' prefix
 * via the @marshal decorator, while offer summaries and other parts of the codebase
 * use hex strings without the prefix.
 *
 * @param hex - The hex string to normalize (with or without '0x' prefix)
 * @returns The normalized hex string (lowercase, no '0x' prefix)
 */
export default function normalizeHex(hex: string): string {
  return hex.toLowerCase().replace(/^0x/, '');
}
