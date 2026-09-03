import probeMediaPlayability, { resetMediaPlayabilityVerdicts } from './probeMediaPlayability';

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

  it('probes again after an unknown verdict', async () => {
    const first = fakeMediaElement(2);
    const firstVerdict = probe(first, 'cache://flaky');
    first.emit('error');
    await expect(firstVerdict).resolves.toBe('unknown');

    const second = fakeMediaElement();
    const secondVerdict = probe(second, 'cache://flaky');
    second.emit('loadedmetadata');
    await expect(secondVerdict).resolves.toBe('playable');
  });
});
