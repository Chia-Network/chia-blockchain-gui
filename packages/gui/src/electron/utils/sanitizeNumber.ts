// The cache size limit as the main process will apply it. Zero is refused
// along with negatives, NaN and Infinity: both eviction gates in CacheManager
// are `> 0`, so zero would not mean "no cache" but "no eviction" — the state
// SEC-866 was filed to make unreachable from the renderer, and one an empty
// settings field would otherwise reach by accident (Number('') === 0).
export default function sanitizeNumber(input: number | string): number {
  const size = typeof input === 'string' ? Number(input) : input;

  if ((typeof input === 'string' && input.trim() === '') || !Number.isFinite(size) || size <= 0) {
    throw new Error('Invalid maxTotalSize value. It must be a positive finite number.');
  }

  return size;
}
