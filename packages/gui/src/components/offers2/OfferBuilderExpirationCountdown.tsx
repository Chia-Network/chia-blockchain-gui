import { StateColor } from '@chia-network/core';
import { Typography } from '@mui/material';
import React from 'react';

import { getOfferExpirationTimeAsTuple } from '../../hooks/useOfferExpirationDefaultTime';

export default function OfferBuilderExpirationCountdown(currentTime, expirationTime, isCaption?) {
  const timeUntilExpiration = expirationTime - currentTime;
  const timeUntilExpirationAsTuple = getOfferExpirationTimeAsTuple(timeUntilExpiration);

  let countdownColor = isCaption ? StateColor.SUCCESS : StateColor.INFO;
  let countdownDisplay = null;

  if (timeUntilExpiration > 86_399) {
    countdownDisplay = `Offer will expire in ${timeUntilExpirationAsTuple.days} day${
      timeUntilExpirationAsTuple.days > 1 ? 's' : ''
    }`;
  } else if (timeUntilExpiration > 3599) {
    countdownColor = isCaption ? StateColor.WARNING : countdownColor;
    countdownDisplay = `Offer will expire in ${timeUntilExpirationAsTuple.hours} hour${
      timeUntilExpirationAsTuple.hours > 1 ? 's' : ''
    }`;
  } else if (timeUntilExpiration > 59) {
    countdownColor = isCaption ? StateColor.WARNING : countdownColor;
    countdownDisplay = `Offer will expire in ${timeUntilExpirationAsTuple.minutes} minute${
      timeUntilExpirationAsTuple.minutes > 1 ? 's' : ''
    }`;
  } else if (timeUntilExpiration < 0) {
    countdownColor = isCaption ? StateColor.ERROR : countdownColor;
    countdownDisplay = `Offer has expired`;
  }

  return (
    <Typography color={countdownColor} variant={isCaption ? 'caption' : 'body2'}>
      {countdownDisplay}
    </Typography>
  );
}
