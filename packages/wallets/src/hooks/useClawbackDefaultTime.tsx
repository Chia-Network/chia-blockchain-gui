import { usePrefs } from '@chia-network/api-react';
import { useCallback, useMemo } from 'react';

export type ClawbackDefaultTimeInput = {
  days: number | string;
  hours: number | string;
  minutes: number | string;
};

export type ClawbackDefaultTimeOutput = {
  days: number;
  hours: number;
  minutes: number;
};

export const clawbackDefaultTimeDefaults = {
  days: 0,
  hours: 0,
  minutes: 0,
};

function stringPropertiesToNumbers(objWithStrings: ClawbackDefaultTimeInput) {
  return {
    days: Number(objWithStrings.days),
    hours: Number(objWithStrings.hours),
    minutes: Number(objWithStrings.minutes),
  };
}

export default function useClawbackDefaultTime() {
  const [clawbackDefaultTime, setClawbackDefaultTimeLocal] = usePrefs<ClawbackDefaultTimeOutput>(
    'clawbackDefaultTime',
    clawbackDefaultTimeDefaults
  );

  const isClawbackDefaultTimeEnabled = useMemo(
    () => clawbackDefaultTime.days > 0 || clawbackDefaultTime.hours > 0 || clawbackDefaultTime.minutes > 0,
    [clawbackDefaultTime]
  );

  const setClawbackDefaultTime = useCallback(
    (clawbackDefaultTimeInput: ClawbackDefaultTimeInput) => {
      setClawbackDefaultTimeLocal(stringPropertiesToNumbers(clawbackDefaultTimeInput));
    },
    [setClawbackDefaultTimeLocal]
  );

  const toReturn = useMemo(
    () => ({ clawbackDefaultTime, setClawbackDefaultTime, isClawbackDefaultTimeEnabled }),
    [clawbackDefaultTime, setClawbackDefaultTime, isClawbackDefaultTimeEnabled]
  );
  return toReturn;
}
