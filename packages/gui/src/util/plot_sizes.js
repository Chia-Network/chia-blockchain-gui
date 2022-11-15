export function calculateSizeFromK(k) {
  return Math.floor(780 * k * 2 ** (k - 10));
}
