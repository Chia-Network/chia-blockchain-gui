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

// Verdicts are a property of the file, and the cache serves every file from a
// stable cache:// URL, so a verdict is kept for the lifetime of the renderer
// and reused when the same tile mounts again — without this every scroll past
// an unplayable video would open another decoder probe.
const verdicts = new Map<string, MediaPlayability>();

function rememberVerdict(src: string, verdict: MediaPlayability) {
  if (verdicts.size >= MAX_REMEMBERED_VERDICTS) {
    // the map iterates in insertion order — evict the oldest verdict
    const oldest = verdicts.keys().next().value;
    if (oldest !== undefined) {
      verdicts.delete(oldest);
    }
  }
  verdicts.set(src, verdict);
}

/** For tests: forget every remembered verdict. */
export function resetMediaPlayabilityVerdicts() {
  verdicts.clear();
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

  const remembered = verdicts.get(src);
  if (remembered && remembered !== 'unknown') {
    return Promise.resolve(remembered);
  }

  if (signal?.aborted) {
    return Promise.resolve('unknown');
  }

  return new Promise<MediaPlayability>((resolve) => {
    const element = createElement(kind);
    const cleanups: (() => void)[] = [];
    let settled = false;

    const settle = (verdict: MediaPlayability) => {
      if (settled) {
        return;
      }
      settled = true;

      cleanups.forEach((cleanup) => cleanup());

      // release the decoder and any open connection right away
      element.removeAttribute('src');
      element.load();

      if (verdict !== 'unknown') {
        rememberVerdict(src, verdict);
      }
      resolve(verdict);
    };

    const onLoadedMetadata = () => settle('playable');
    element.addEventListener('loadedmetadata', onLoadedMetadata);
    cleanups.push(() => element.removeEventListener('loadedmetadata', onLoadedMetadata));

    const onError = () => {
      const code = element.error?.code;
      settle(code === MEDIA_ERR_SRC_NOT_SUPPORTED || code === MEDIA_ERR_DECODE ? 'unsupported' : 'unknown');
    };
    element.addEventListener('error', onError);
    cleanups.push(() => element.removeEventListener('error', onError));

    const onAbort = () => settle('unknown');
    signal?.addEventListener('abort', onAbort);
    cleanups.push(() => signal?.removeEventListener('abort', onAbort));

    const timer = setTimeout(() => settle('unknown'), timeout);
    cleanups.push(() => clearTimeout(timer));

    element.preload = 'metadata';
    element.muted = true;
    element.src = src;
    element.load();
  });
}
