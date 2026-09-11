// Recent views stay responsive, while one oldest task runs after each burst.
export const MAX_LIFO_BURST = 8;

export default function limit(concurrency: number, options: { lifo?: boolean } = {}) {
  const { lifo = false } = options;

  const queue: {
    func: Function;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }[] = [];
  let active = 0;
  let recentStarts = 0;

  async function execute() {
    if (!queue.length || active >= concurrency) {
      return;
    }

    active++;

    // LIFO runs the most recently requested task first, so work triggered by
    // what the user is currently looking at is not starved by a long backlog
    // of earlier background requests.
    const takeRecent = lifo && queue.length > 1 && recentStarts < MAX_LIFO_BURST;
    const item = takeRecent ? queue.pop() : queue.shift();
    recentStarts = takeRecent ? recentStarts + 1 : 0;
    if (!item) {
      return;
    }

    const { func, resolve, reject } = item;
    try {
      const result = await func();
      resolve(result);
    } catch (e) {
      reject(e as Error);
    } finally {
      active--;
      execute();
    }
  }

  function add<T>(func: Function) {
    return new Promise<T>((resolve, reject) => {
      queue.push({ func, resolve, reject });
      execute();
    });
  }

  return add;
}
