import limit, { MAX_LIFO_BURST } from './limit';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('limit', () => {
  it('admits an old task even when newer work keeps arriving', async () => {
    const add = limit(1, { lifo: true });
    const first = deferred();
    const order: string[] = [];
    const tasks = [add(() => first.promise), add(() => order.push('old'))];
    const recent = () => {
      order.push('recent');
      if (order.length <= MAX_LIFO_BURST) {
        tasks.push(add(recent));
      }
    };
    tasks.push(add(recent));
    first.resolve();
    await tasks[1];
    expect(order.indexOf('old')).toBeLessThanOrEqual(MAX_LIFO_BURST);
    await Promise.all(tasks);
  });

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
