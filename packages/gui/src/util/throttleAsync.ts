type FN = () => Promise<void>;

export default function throttleAsync() {
  let processing: boolean = false;
  let nextFn: FN | undefined;

  async function process(fn: FN) {
    if (processing) {
      nextFn = fn;
      return;
    }

    try {
      processing = true;
      await fn();
    } finally {
      processing = false;

      if (nextFn) {
        const currentFn = nextFn;
        nextFn = undefined;
        process(currentFn);
      }
    }
  }

  return process;
}
