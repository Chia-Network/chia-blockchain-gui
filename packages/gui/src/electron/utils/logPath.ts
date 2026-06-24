import { app } from 'electron';
import fsBase from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Returns the default Chia debug log path derived from CHIA_ROOT (or the
 * standard `~/.chia/mainnet` location). This is the only log path used when the
 * user has not explicitly chosen a custom one via the native file picker.
 */
export function getDefaultLogPath(): string {
  const chiaRoot = process.env.CHIA_ROOT || path.join(app.getPath('home'), '.chia', 'mainnet');
  return path.join(chiaRoot, 'log', 'debug.log');
}

export class LogPathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LogPathValidationError';
  }
}

/**
 * Validates and canonicalizes a log path before it is read or its metadata is
 * exposed to the renderer.
 *
 * Even though the renderer can no longer influence `customLogPath` (it can only
 * be set through the native file picker in `ChiaLogsAPI.SET_PATH`), the value on
 * disk in `prefs.yaml` could still be tampered with out-of-band. This guard
 * resolves the real path and refuses symlinks and non-regular files so that a
 * planted symlink cannot redirect a read to an unrelated, sensitive file.
 *
 * The returned value is the fully-resolved absolute path, which callers should
 * display to the user (e.g. in the confirmation dialog) so the file being read
 * is always visible and a phishing prompt is not possible.
 */
export async function resolveTrustedLogPath(rawPath: string): Promise<string> {
  if (typeof rawPath !== 'string' || rawPath.trim() === '') {
    throw new LogPathValidationError('Log path is empty');
  }

  // Reject a symlink at the leaf before resolving, so the rejection reason is
  // explicit rather than silently following the link.
  const linkStats = await fs.lstat(rawPath);
  if (linkStats.isSymbolicLink()) {
    throw new LogPathValidationError('Refusing to read a symlinked log path');
  }

  // Canonicalize the path (resolves any intermediate symlinks and `..`
  // segments) so the value shown to the user matches exactly what is read.
  const resolvedPath = await fs.realpath(rawPath);

  const stats = await fs.stat(resolvedPath);
  if (!stats.isFile()) {
    throw new LogPathValidationError('Log path is not a regular file');
  }

  await fs.access(resolvedPath, fsBase.constants.R_OK);

  return resolvedPath;
}
