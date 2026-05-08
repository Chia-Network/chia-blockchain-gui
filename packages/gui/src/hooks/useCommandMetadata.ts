import { useEffect, useState } from 'react';

import type { PermissionsCommandMetadata } from '../@types/PermissionsService';

type CommandsByWc = Map<string, PermissionsCommandMetadata>;

const EMPTY: CommandsByWc = new Map();

let cached: Promise<CommandsByWc> | null = null;

function fetchCommandsByWc(): Promise<CommandsByWc> {
  if (!cached) {
    cached = (async () => {
      try {
        const rows = await window.permissionsAPI.commandsMetadata();
        const map: CommandsByWc = new Map();
        for (const row of rows) map.set(row.wcCommand, row);
        return map;
      } catch (err) {
        cached = null;
        throw err;
      }
    })();
  }
  return cached;
}

export default function useCommandMetadata(): {
  isLoading: boolean;
  byWc: CommandsByWc;
} {
  const [byWc, setByWc] = useState<CommandsByWc>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const map = await fetchCommandsByWc();
        if (cancelled) return;
        setByWc(map);
      } catch {
        if (cancelled) return;
        setByWc(EMPTY);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isLoading, byWc };
}
