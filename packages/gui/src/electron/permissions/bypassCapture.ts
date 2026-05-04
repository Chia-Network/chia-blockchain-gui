import type { PairRecord } from './types';

export type CaptureBypassDeps = {
  getPair: (topic: string) => PairRecord | undefined;
  upsertPair: (pair: PairRecord) => void;
};

// Returns the new list when persistence happened, null for every no-op path.
// Idempotent on already-listed commands. See bypassCapture.test.ts for the
// matrix of openReactDialog result shapes.
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
