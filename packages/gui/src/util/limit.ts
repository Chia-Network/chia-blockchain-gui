export default function limit(concurrency: number) {
  const queue: {
    func: Function;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }[] = [];
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
