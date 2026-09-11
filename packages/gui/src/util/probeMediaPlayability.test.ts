import probeMediaPlayability, {
  resetMediaPlayabilityVerdicts,
  MAX_CONCURRENT_MEDIA_PROBES,
  MAX_QUEUED_MEDIA_PROBES,
  UNKNOWN_VERDICT_TTL,
} from './probeMediaPlayability';

type FakeMediaElement = HTMLVideoElement & {
  emit: (event: string) => void;
  loadCalls: number;
};

// the tests run without a DOM, so a fake element stands in for the probe's
// <video>/<audio> and its events are driven by hand
function fakeMediaElement(errorCode?: number): FakeMediaElement {
  const listeners = new Map<string, Set<() => void>>();
  const element = {
    error: errorCode === undefined ? null : { code: errorCode },
    loadCalls: 0,
    preload: '',
    muted: false,
    src: '',
    addEventListener: (event: string, listener: () => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener);
    },
    removeEventListener: (event: string, listener: () => void) => {
      listeners.get(event)?.delete(listener);
    },
    removeAttribute: () => {},
    load: () => {
      element.loadCalls += 1;
    },
    emit: (event: string) => {
      listeners.get(event)?.forEach((listener) => listener());
    },
  } as unknown as FakeMediaElement;

  return element;
}

function probe(element: FakeMediaElement, src: string, kind: 'video' | 'audio' = 'video', options = {}) {
  return probeMediaPlayability(src, kind, { createElement: () => element, ...options });
}

describe('probeMediaPlayability', () => {
  beforeEach(() => {
    resetMediaPlayabilityVerdicts();
    jest.useRealTimers();
  });

  it('bounds active decoders and removes a queued cancellation without admitting extra work', async () => {
    const active = Array.from({ length: MAX_CONCURRENT_MEDIA_PROBES }, () => fakeMediaElement());
    const running = active.map((element, i) => probe(element, `cache://active-${i}`));
    const controller = new AbortController();
    const canceledElement = jest.fn(() => fakeMediaElement());
    const canceled = probeMediaPlayability('cache://queued-cancel', 'video', {
      signal: controller.signal,
      createElement: canceledElement,
    });
    const next = fakeMediaElement();
    const createNext = jest.fn(() => next);
    const queued = probeMediaPlayability('cache://next', 'video', { createElement: createNext });
    controller.abort();
    await expect(canceled).resolves.toBe('unknown');
    expect(canceledElement).not.toHaveBeenCalled();
    expect(createNext).not.toHaveBeenCalled();
    active[0].emit('loadedmetadata');
    expect(createNext).toHaveBeenCalledTimes(1);
    active.slice(1).forEach((element) => element.emit('loadedmetadata'));
    next.emit('loadedmetadata');
    await Promise.all([...running, queued]);
  });

  it('expires queued probes without allocating an element and caps the queue', async () => {
    jest.useFakeTimers();
    const active = Array.from({ length: MAX_CONCURRENT_MEDIA_PROBES }, (_, i) =>
      probe(fakeMediaElement(), `cache://held-${i}`),
    );
    const createElement = jest.fn(() => fakeMediaElement());
    const queued = Array.from({ length: MAX_QUEUED_MEDIA_PROBES }, (_, i) =>
      probeMediaPlayability(`cache://queued-${i}`, 'video', { timeout: 100, createElement }),
    );
    await expect(probeMediaPlayability('cache://overflow', 'video', { createElement })).resolves.toBe('unknown');
    jest.advanceTimersByTime(100);
    expect(await Promise.all(queued)).toEqual(Array(MAX_QUEUED_MEDIA_PROBES).fill('unknown'));
    expect(createElement).not.toHaveBeenCalled();
    jest.advanceTimersByTime(15_000);
    await Promise.all(active);
  });

  it('releases slots when element creation fails', async () => {
    const createElement = () => {
      throw new Error('No decoder');
    };
    const failures = Array.from({ length: MAX_CONCURRENT_MEDIA_PROBES + 1 }, (_, i) =>
      probeMediaPlayability(`cache://failed-${i}`, 'video', { createElement }),
    );
    expect(await Promise.all(failures)).toEqual(Array(failures.length).fill('unknown'));
    const element = fakeMediaElement();
    const next = probe(element, 'cache://after-failure');
    element.emit('loadedmetadata');
    await expect(next).resolves.toBe('playable');
  });

  it('reports a file whose metadata loads as playable', async () => {
    const element = fakeMediaElement();

    const verdict = probe(element, 'cache://h264');
    expect(element.preload).toBe('metadata');
    expect(element.src).toBe('cache://h264');
    element.emit('loadedmetadata');

    await expect(verdict).resolves.toBe('playable');
  });

  it('reports a source the media pipeline cannot decode as unsupported', async () => {
    const element = fakeMediaElement(4 /* MEDIA_ERR_SRC_NOT_SUPPORTED */);

    const verdict = probe(element, 'cache://hevc');
    element.emit('error');

    await expect(verdict).resolves.toBe('unsupported');
  });

  it('reports a decode failure as unsupported', async () => {
    const element = fakeMediaElement(3 /* MEDIA_ERR_DECODE */);

    const verdict = probe(element, 'cache://corrupt', 'audio');
    element.emit('error');

    await expect(verdict).resolves.toBe('unsupported');
  });

  it('does not blame the file for a network error', async () => {
    const element = fakeMediaElement(2 /* MEDIA_ERR_NETWORK */);

    const verdict = probe(element, 'cache://gone');
    element.emit('error');

    await expect(verdict).resolves.toBe('unknown');
  });

  it('gives up as unknown when the element never reports', async () => {
    jest.useFakeTimers();

    const verdict = probe(fakeMediaElement(), 'cache://silent', 'video', { timeout: 1000 });
    jest.advanceTimersByTime(1000);

    await expect(verdict).resolves.toBe('unknown');
  });

  it('settles as unknown when aborted', async () => {
    const controller = new AbortController();

    const verdict = probe(fakeMediaElement(), 'cache://aborted', 'video', { signal: controller.signal });
    controller.abort();

    await expect(verdict).resolves.toBe('unknown');
  });

  it('releases the element once it has settled', async () => {
    const element = fakeMediaElement();

    const verdict = probe(element, 'cache://h264');
    element.emit('loadedmetadata');
    await verdict;

    // one load() to start the probe, one after clearing src to release it
    expect(element.loadCalls).toBe(2);
  });

  it('remembers a definite verdict and does not probe the same file again', async () => {
    const element = fakeMediaElement(4);
    const first = probe(element, 'cache://hevc');
    element.emit('error');
    await expect(first).resolves.toBe('unsupported');

    const createElement = jest.fn();
    await expect(probeMediaPlayability('cache://hevc', 'video', { createElement })).resolves.toBe('unsupported');
    expect(createElement).not.toHaveBeenCalled();
  });

  it('probes again after an unknown verdict, once its short memory has expired', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    try {
      const first = fakeMediaElement(2);
      const firstVerdict = probe(first, 'cache://flaky');
      first.emit('error');
      await expect(firstVerdict).resolves.toBe('unknown');

      nowSpy.mockReturnValue(1_000_000 + UNKNOWN_VERDICT_TTL + 1);
      const second = fakeMediaElement();
      const secondVerdict = probe(second, 'cache://flaky');
      second.emit('loadedmetadata');
      await expect(secondVerdict).resolves.toBe('playable');
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('remembers an undecided probe for a while so a remount does not hold a slot again', async () => {
    jest.useFakeTimers();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    try {
      const created: FakeMediaElement[] = [];
      const createElement = () => {
        const element = fakeMediaElement();
        created.push(element);
        return element as unknown as HTMLMediaElement;
      };
      const first = probeMediaPlayability('cache://slow-chiacache', 'video', { createElement, timeout: 100 });
      jest.advanceTimersByTime(100);
      await expect(first).resolves.toBe('unknown');
      expect(created).toHaveLength(1);

      // the same file again, moments later: no new element, same answer
      await expect(probeMediaPlayability('cache://slow-chiacache', 'video', { createElement })).resolves.toBe(
        'unknown',
      );
      expect(created).toHaveLength(1);

      // ... and once the memory has expired, it is probed afresh
      nowSpy.mockReturnValue(1_000_000 + UNKNOWN_VERDICT_TTL + 1);
      const later = probeMediaPlayability('cache://slow-chiacache', 'video', { createElement });
      expect(created).toHaveLength(2);
      created[1].emit('loadedmetadata');
      await expect(later).resolves.toBe('playable');
    } finally {
      nowSpy.mockRestore();
      jest.useRealTimers();
    }
  });
});
