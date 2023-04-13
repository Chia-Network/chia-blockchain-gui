import { useLocalStorage } from '@rehooks/local-storage';
import { useMemo } from 'react';

export type ClawbackDefaultTime = {
  days: number;
  hours: number;
  minutes: number;
};

const clawbackDefaultTimeDefaults = {
  days: 0,
  hours: 0,
  minutes: 0,
};

export default function useClawbackDefaultTime() {
  const [clawbackDefaultTime, setClawbackDefaultTime] = useLocalStorage<ClawbackDefaultTime>(
    'clawbackDefaultTime',
    clawbackDefaultTimeDefaults
  );

  const isClawbackDefaultTimeEnabled = useMemo(
    () => clawbackDefaultTime.days > 0 || clawbackDefaultTime.hours > 0 || clawbackDefaultTime.minutes > 0,
    [clawbackDefaultTime]
  );

  const toReturn = useMemo(
    () => ({ clawbackDefaultTime, setClawbackDefaultTime, isClawbackDefaultTimeEnabled }),
    [clawbackDefaultTime, setClawbackDefaultTime, isClawbackDefaultTimeEnabled]
  );
  return toReturn;
}
