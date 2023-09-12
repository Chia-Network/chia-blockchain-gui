import { usePrefs } from '@chia-network/api-react';
import { useCallback, useMemo } from 'react';

export type OfferExpirationDefaultTimeInput = {
  enabled: boolean;
  days: number | string;
  hours: number | string;
  minutes: number | string;
};

export type OfferExpirationDefaultTimeOutput = {
  enabled: boolean;
  days: number;
  hours: number;
  minutes: number;
};

export const offerExpirationDefaultTimeDefaults = {
  enabled: true,
  days: 7,
  hours: 0,
  minutes: 0,
};

export function getOfferExpirationTimeInSeconds(offerExpirationTimeObject: OfferExpirationDefaultTimeInput) {
  const { days, hours, minutes } = stringPropertiesToNumbers(offerExpirationTimeObject);
  const daysInSeconds = days * 24 * 60 * 60;
  const hoursInSeconds = hours * 60 * 60;
  const minutesInSeconds = minutes * 60;
  return daysInSeconds + hoursInSeconds + minutesInSeconds;
}

export function getOfferExpirationTimeAsTuple(timeInSeconds) {
  const days = Math.floor(timeInSeconds / (24 * 60 * 60));
  const hours = Math.floor((timeInSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor(((timeInSeconds % (24 * 60 * 60)) % (60 * 60)) / 60);
  return { days, hours, minutes };
}

function stringPropertiesToNumbers(objWithStrings: OfferExpirationDefaultTimeInput) {
  return {
    enabled: Boolean(objWithStrings.enabled),
    days: Number(objWithStrings.days),
    hours: Number(objWithStrings.hours),
    minutes: Number(objWithStrings.minutes),
  };
}

export default function useOfferExpirationDefaultTime() {
  const [offerExpirationDefaultTime, setOfferExpirationDefaultTimeLocal] = usePrefs<OfferExpirationDefaultTimeOutput>(
    'offerExpirationDefaultTime',
    offerExpirationDefaultTimeDefaults
  );

  const isOfferExpirationDefaultTimeEnabled = useMemo(
    () => offerExpirationDefaultTime.enabled === true,
    [offerExpirationDefaultTime]
  );

  const setOfferExpirationDefaultTime = useCallback(
    (offerExpirationDefaultTimeInput: OfferExpirationDefaultTimeInput) => {
      setOfferExpirationDefaultTimeLocal(stringPropertiesToNumbers(offerExpirationDefaultTimeInput));
    },
    [setOfferExpirationDefaultTimeLocal]
  );

  const toReturn = useMemo(
    () => ({ offerExpirationDefaultTime, setOfferExpirationDefaultTime, isOfferExpirationDefaultTimeEnabled }),
    [offerExpirationDefaultTime, setOfferExpirationDefaultTime, isOfferExpirationDefaultTimeEnabled]
  );
  return toReturn;
}
