import DownloadDeadline, { DEFAULT_DOWNLOAD_MAX_DURATION, normalizeDownloadDuration } from './DownloadDeadline';

describe('DownloadDeadline', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each([0, -1, NaN, Infinity, '100', null])('rejects invalid duration %p', (duration) => {
    expect(() => normalizeDownloadDuration(duration as number)).toThrow('positive finite');
  });

  it('keeps the default ceiling and clamps excessive finite values', () => {
    expect(normalizeDownloadDuration(undefined)).toBe(DEFAULT_DOWNLOAD_MAX_DURATION);
    expect(normalizeDownloadDuration(Number.MAX_VALUE)).toBe(DEFAULT_DOWNLOAD_MAX_DURATION);
  });

  it('does not start a transfer timer while queued', () => {
    const abort = jest.fn();
    const deadline = new DownloadDeadline(100, abort);
    jest.advanceTimersByTime(1000);
    expect(abort).not.toHaveBeenCalled();
    deadline.start();
    jest.advanceTimersByTime(100);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(deadline.error?.message).toContain('download deadline');
  });

  it('shortens a coalesced request relative to its original start', () => {
    const abort = jest.fn();
    const deadline = new DownloadDeadline(undefined, abort);
    deadline.start();
    jest.advanceTimersByTime(80);
    deadline.constrain(100);
    jest.advanceTimersByTime(19);
    expect(abort).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('does not extend a short request when a longer caller joins', () => {
    const abort = jest.fn();
    const deadline = new DownloadDeadline(100, abort);
    deadline.start();
    jest.advanceTimersByTime(50);
    deadline.constrain(undefined);
    jest.advanceTimersByTime(50);
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('aborts immediately if a new constraint has already elapsed', () => {
    const abort = jest.fn();
    const deadline = new DownloadDeadline(undefined, abort);
    deadline.start();
    jest.advanceTimersByTime(200);
    deadline.constrain(100);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(() => deadline.remaining()).toThrow('download deadline');
  });

  it('disposes the timer when the operation settles', () => {
    const abort = jest.fn();
    const deadline = new DownloadDeadline(100, abort);
    deadline.start();
    deadline.dispose();
    jest.advanceTimersByTime(1000);
    expect(abort).not.toHaveBeenCalled();
  });
});

describe('DownloadDeadline.whenStarted', () => {
  it('resolves when the transfer starts, and at once if it already has', async () => {
    const deadline = new DownloadDeadline(1000, () => {});
    let started = false;
    const waited = deadline.whenStarted().then(() => {
      started = true;
    });
    await Promise.resolve();
    expect(started).toBe(false);
    deadline.start();
    await waited;
    expect(started).toBe(true);
    await expect(deadline.whenStarted()).resolves.toBeUndefined();
    deadline.finish();
  });

  it('resolves when the request finishes without a transfer, and at once afterwards', async () => {
    const deadline = new DownloadDeadline(1000, () => {});
    let woken = false;
    const waited = deadline.whenStarted().then(() => {
      woken = true;
    });
    await Promise.resolve();
    expect(woken).toBe(false);
    // served from the cache: finished, never started
    deadline.finish();
    await waited;
    expect(woken).toBe(true);
    await expect(deadline.whenStarted()).resolves.toBeUndefined();
  });
});
