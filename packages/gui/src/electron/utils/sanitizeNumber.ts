export default function sanitizeNumber(input: number | string): number {
  let size: number;

  if (typeof input === 'string') {
    size = parseInt(input, 10);
  } else {
    size = input;
  }

  if (Number.isNaN(size) || size <= 0) {
    throw new Error('Invalid maxTotalSize value. It must be a positive number.');
  }

  return size;
}
