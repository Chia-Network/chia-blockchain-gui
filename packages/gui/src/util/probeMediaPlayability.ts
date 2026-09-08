export type MediaPlayability = 'playable' | 'unsupported' | 'unknown';

export type ProbeMediaPlayabilityOptions = {
  // how long to wait for the element to report either way before giving up
  timeout?: number;
  signal?: AbortSignal;
  // the media element to probe with; defaults to a detached DOM element
  createElement?: (kind: 'video' | 'audio') => HTMLMediaElement;
};

// HTMLMediaElement error codes (MediaError.code)
const MEDIA_ERR_DECODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

const DEFAULT_TIMEOUT = 15_000;
const MAX_REMEMBERED_VERDICTS = 500;
export const MAX_CONCURRENT_MEDIA_PROBES = 4;
export const MAX_QUEUED_MEDIA_PROBES = 64;
let activeProbes = 0;
const queuedProbes = new Set<() => void>();

// Verdicts are a property of the file, and the cache serves every file from a
// stable cache:// URL, so a verdict is kept for the lifetime of the renderer
// and reused when the same tile mounts again — without this every scroll past
// an unplayable video would open another decoder probe.
const verdicts = new Map<string, MediaPlayability>();

// An undecided probe — the file neither loaded nor failed within its time —
// is not a property of the file, so it is not kept for good; but probing it
// again on every remount would hold one of the few slots for the full
// timeout each time, and a minter can make files that behave that way. It
// is remembered for a short while instead, and the tile falls open to the
// player as it would after the probe.
export const UNKNOWN_VERDICT_TTL = 60_000;
const unknownUntil = new Map<string, number>();

function evictOldest(map: Map<string, unknown>) {
  if (map.size >= MAX_REMEMBERED_VERDICTS) {
    // the map iterates in insertion order — evict the oldest entry
    const oldest = map.keys().next().value;
    if (oldest !== undefined) {
      map.delete(oldest);
    }
  }
}

function rememberVerdict(src: string, verdict: MediaPlayability) {
  if (verdict === 'unknown') {
    evictOldest(unknownUntil);
    unknownUntil.set(src, Date.now() + UNKNOWN_VERDICT_TTL);
    return;
  }
  evictOldest(verdicts);
  verdicts.set(src, verdict);
}

function rememberedVerdict(src: string): MediaPlayability | undefined {
  const verdict = verdicts.get(src);
  if (verdict) {
    return verdict;
  }
  const until = unknownUntil.get(src);
  if (until !== undefined) {
    if (Date.now() < until) {
      return 'unknown';
    }
    unknownUntil.delete(src);
  }
  return undefined;
}

/** For tests: forget every remembered verdict. */
export function resetMediaPlayabilityVerdicts() {
  verdicts.clear();
  unknownUntil.clear();
}

/**
 * Asks Chromium whether it can decode a media file before that file is handed
 * to a sandboxed player. The player runs in an iframe whose sandbox forbids
 * scripts, so nothing inside it can report a decode failure back; an
 * unplayable file (an HEVC video on Linux, say) would otherwise sit there as an
 * empty player with no explanation.
 *
 * The probe loads only the metadata of `src` into a detached element. Only a
 * definite verdict from the media pipeline counts: a decode or
 * source-not-supported error means 'unsupported', `loadedmetadata` means
 * 'playable'. Anything else — a network error, an abort, the timeout — is
 * 'unknown', and callers should proceed as if the file were playable so a
 * hiccup in the probe never hides a working video.
 */
export default function probeMediaPlayability(
  src: string,
  kind: 'video' | 'audio',
  options: ProbeMediaPlayabilityOptions = {},
): Promise<MediaPlayability> {
  const { timeout = DEFAULT_TIMEOUT, signal, createElement = (tag) => document.createElement(tag) } = options;

  const remembered = rememberedVerdict(src);
  if (remembered) {
    return Promise.resolve(remembered);
  }

  if (signal?.aborted) {
    return Promise.resolve('unknown');
  }

  if (activeProbes >= MAX_CONCURRENT_MEDIA_PROBES && queuedProbes.size >= MAX_QUEUED_MEDIA_PROBES) {
    return Promise.resolve('unknown');
  }

  return new Promise<MediaPlayability>((resolve) => {
    let element: HTMLMediaElement | undefined;
    const cleanups: (() => void)[] = [];
    let settled = false;
    let started = false;
    let start: () => void;

    const settle = (verdict: MediaPlayability) => {
      if (settled) {
        return;
      }
      settled = true;
      queuedProbes.delete(start);
      cleanups.forEach((cleanup) => cleanup());
      try {
        // Release the decoder even when it reported an error.
        element?.removeAttribute('src');
        element?.load();
      } catch {
        // A cleanup failure must still release the shared slot.
      }
      if (started) {
        activeProbes -= 1;
      }
      // an abort is the caller's doing, not a verdict on the file
      if (verdict !== 'unknown' || !signal?.aborted) {
        rememberVerdict(src, verdict);
      }
      resolve(verdict);
      if (activeProbes < MAX_CONCURRENT_MEDIA_PROBES) {
        queuedProbes.values().next().value?.();
      }
    };

    start = () => {
      queuedProbes.delete(start);
      // Another probe may have settled this file while this one was queued.
      const cached = rememberedVerdict(src);
      if (cached) {
        settle(cached);
        return;
      }
      started = true;
      activeProbes += 1;
      try {
        element = createElement(kind);
        const onLoadedMetadata = () => settle('playable');
        const onError = () => {
          const code = element?.error?.code;
          settle(code === MEDIA_ERR_SRC_NOT_SUPPORTED || code === MEDIA_ERR_DECODE ? 'unsupported' : 'unknown');
        };
        element.addEventListener('loadedmetadata', onLoadedMetadata);
        element.addEventListener('error', onError);
        cleanups.push(() => element?.removeEventListener('loadedmetadata', onLoadedMetadata));
        cleanups.push(() => element?.removeEventListener('error', onError));
        element.preload = 'metadata';
        element.muted = true;
        element.src = src;
        element.load();
      } catch {
        settle('unknown');
      }
    };

    const onAbort = () => settle('unknown');
    signal?.addEventListener('abort', onAbort);
    cleanups.push(() => signal?.removeEventListener('abort', onAbort));
    // Include queue wait so an off-screen or stalled probe cannot linger.
    const timer = setTimeout(() => settle('unknown'), timeout);
    cleanups.push(() => clearTimeout(timer));
    if (activeProbes < MAX_CONCURRENT_MEDIA_PROBES) {
      start();
    } else {
      queuedProbes.add(start);
    }
  });
}
