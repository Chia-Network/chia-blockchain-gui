export default function limit(concurrency: number) {
  const queue: { func: Function; resolve: (value: unknown) => void }[] = [];
  let active = 0;

  async function execute() {
    if (!queue.length || active >= concurrency) {
      return;
    }

    active++;

    const item = queue.shift();
    if (!item) {
      return;
    }

    const { func, resolve } = item;
    try {
      const result = await func();
      resolve(result);
    } finally {
      active--;
      execute();
    }
  }

  function add(func: Function) {
    return new Promise((resolve) => {
      queue.push({ func, resolve });
      execute();
    });
  }

  return add;
}
