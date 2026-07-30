export default function sanitizeNumber(input: number | string): number {
  const size = typeof input === 'string' ? Number(input) : input;

  if ((typeof input === 'string' && input.trim() === '') || !Number.isFinite(size) || size < 0) {
    throw new Error('Invalid maxTotalSize value. It must be a non-negative finite number.');
  }

  return size;
}
