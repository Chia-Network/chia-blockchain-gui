import limit from './limit';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('limit', () => {
  it('runs queued tasks in FIFO order by default', async () => {
    const add = limit(1);
    const first = deferred();
    const order: string[] = [];

    const tasks = [
      add(async () => {
        await first.promise;
        order.push('a');
      }),
      add(async () => {
        order.push('b');
      }),
      add(async () => {
        order.push('c');
      }),
    ];

    first.resolve();
    await Promise.all(tasks);

    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('runs the most recently queued task first in LIFO mode', async () => {
    const add = limit(1, { lifo: true });
    const first = deferred();
    const order: string[] = [];

    const tasks = [
      add(async () => {
        await first.promise;
        order.push('a');
      }),
      add(async () => {
        order.push('b');
      }),
      add(async () => {
        order.push('c');
      }),
    ];

    first.resolve();
    await Promise.all(tasks);

    expect(order).toEqual(['a', 'c', 'b']);
  });
});
