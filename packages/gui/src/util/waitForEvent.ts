/** Minimal emitter shape — matches WalletConnect, Node EventEmitter, etc. */
interface EventEmitterLike<EventMap> {
  on<K extends keyof EventMap>(event: K, listener: (arg: EventMap[K]) => void): unknown;
  off<K extends keyof EventMap>(event: K, listener: (arg: EventMap[K]) => void): unknown;
}

interface WaitForEventOptions<T> {
  /** Timeout in milliseconds. Defaults to 15_000. */
  timeoutMs?: number;
  /** Custom error message on timeout. */
  timeoutMessage?: string;
  /** Only resolve when this predicate returns true. Non-matching events are ignored. */
  filter?: (value: T) => boolean;
  /** Optional AbortSignal to cancel waiting externally. */
  signal?: AbortSignal;
}

export function waitForEvent<EventMap, K extends keyof EventMap>(
  emitter: EventEmitterLike<EventMap>,
  event: K,
  options: WaitForEventOptions<EventMap[K]> = {},
): Promise<EventMap[K]> {
  const {
    timeoutMs = 15_000,
    timeoutMessage = `Timed out after ${timeoutMs}ms waiting for "${String(event)}"`,
    filter,
    signal,
  } = options;

  return new Promise<EventMap[K]>((resolve, reject) => {
    let settled = false;
    let timeoutId: NodeJS.Timeout | undefined;
    let onAbort: (() => void) | undefined;

    function handler(value: EventMap[K]) {
      if (filter && !filter(value)) return;
      settle(() => resolve(value));
    }

    function cleanUp() {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (onAbort && signal) {
        signal.removeEventListener('abort', onAbort);
        onAbort = undefined;
      }
      emitter.off(event, handler);
    }

    function settle(fn: () => void) {
      if (settled) return;
      settled = true;
      cleanUp();
      fn();
    }

    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    timeoutId = setTimeout(() => {
      settle(() => reject(new Error(timeoutMessage)));
    }, timeoutMs);

    if (signal) {
      onAbort = () => settle(() => reject(new Error('Aborted')));
      signal.addEventListener('abort', onAbort, { once: true });
    }

    emitter.on(event, handler);
  });
}
