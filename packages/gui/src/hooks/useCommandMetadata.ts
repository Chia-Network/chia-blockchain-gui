import { useCallback, useEffect, useState } from 'react';

import type { PermissionsCommandMetadata } from '../@types/PermissionsService';

type Lookup = {
  /** Pre-indexed by wcCommand (wire form). */
  byWc: Map<string, PermissionsCommandMetadata>;
  list: PermissionsCommandMetadata[];
};

const empty: Lookup = { byWc: new Map(), list: [] };

/**
 * Single-source-of-truth metadata for every WC-callable command, fetched
 * from main via `permissionsAPI.commandsMetadata`. Replaces the renderer-
 * side `walletConnectCommands.tsx` table — labels, descriptions, and the
 * `requiresSync` flag all come from main's `commandRegistry` now.
 *
 * Refetched on `refresh()` — call this after a locale switch if you want
 * the cached strings to reflect the new language. The renderer's i18n
 * does not auto-rerender these because main resolves them at fetch time.
 */
export default function useCommandMetadata(): {
  isLoading: boolean;
  byWc: Map<string, PermissionsCommandMetadata>;
  list: PermissionsCommandMetadata[];
  refresh: () => void;
} {
  const [{ byWc, list }, setLookup] = useState<Lookup>(empty);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    window.permissionsAPI
      .commandsMetadata()
      .then((rows) => {
        if (cancelled) return;
        const byWcLocal = new Map<string, PermissionsCommandMetadata>();
        for (const row of rows) byWcLocal.set(row.wcCommand, row);
        setLookup({ byWc: byWcLocal, list: rows });
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLookup(empty);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  return { isLoading, byWc, list, refresh };
}
