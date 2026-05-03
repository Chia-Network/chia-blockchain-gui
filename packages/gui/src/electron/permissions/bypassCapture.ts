import type { PairRecord } from './types';

export type CaptureBypassDeps = {
  getPair: (topic: string) => PairRecord | undefined;
  upsertPair: (pair: PairRecord) => void;
};

/**
 * Persist `pair.bypass += wcCommand` if and only if the Confirm dialog's
 * form result is a "Don't ask again" approval. Pulled out of `main.tsx`'s
 * `DISPATCH_AS_PAIR` handler so the result-shape interpretation can be
 * unit-tested without the IPC / dialog runtime.
 *
 * `result` shapes from `openReactDialog`:
 *   - `false` / `undefined` — Cancel button or dialog closed. No-op.
 *   - `true` — Confirm clicked, dialog had no form fields collected
 *     (`showBypassToggle: false`). No-op.
 *   - object with `bypass: true` — Confirm clicked with the checkbox
 *     enabled. Append `wcCommand` to `pair.bypass` (idempotent — already
 *     listed commands are not duplicated).
 *   - object with `bypass: false` / missing — Confirm without bypass.
 *     No-op.
 *
 * Returns the new bypass list when persistence happened, or `null` for
 * every no-op path. Used by tests to assert mutation versus skip; main
 * ignores the return value.
 */
export function captureBypassFromConfirmResult(
  result: unknown,
  ctx: { topic: string; wcCommand: string },
  deps: CaptureBypassDeps,
): string[] | null {
  if (typeof result !== 'object' || result === null) return null;
  const r = result as { bypass?: unknown };
  if (r.bypass !== true) return null;
  const pair = deps.getPair(ctx.topic);
  if (!pair) return null;
  if (pair.bypass.includes(ctx.wcCommand)) return pair.bypass;
  const nextBypass = [...pair.bypass, ctx.wcCommand];
  deps.upsertPair({ ...pair, bypass: nextBypass, updatedAt: Date.now() });
  return nextBypass;
}
