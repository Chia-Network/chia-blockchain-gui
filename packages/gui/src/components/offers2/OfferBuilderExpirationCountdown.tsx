import { StateColor } from '@chia-network/core';
import { Typography } from '@mui/material';
import React from 'react';

import { getOfferExpirationTimeAsTuple } from '../../hooks/useOfferExpirationDefaultTime';

export default function OfferBuilderExpirationCountdown(currentTime, expirationTime) {
  const timeUntilExpiration = expirationTime - currentTime;
  const timeUntilExpirationAsTuple = getOfferExpirationTimeAsTuple(timeUntilExpiration);

  let countdownColor = StateColor.SUCCESS;
  let countdownDisplay = null;

  if (timeUntilExpiration > 86_400) {
    countdownDisplay = `Offer will expire in ${timeUntilExpirationAsTuple.days} day${
      timeUntilExpirationAsTuple.days > 1 ? 's' : ''
    }`;
  } else if (timeUntilExpiration > 3600) {
    countdownColor = StateColor.WARNING;
    countdownDisplay = `Offer will expire in ${timeUntilExpirationAsTuple.hours} hour${
      timeUntilExpirationAsTuple.hours > 1 ? 's' : ''
    }`;
  } else if (timeUntilExpiration > 60) {
    countdownColor = StateColor.WARNING;
    countdownDisplay = `Offer will expire in ${timeUntilExpirationAsTuple.minutes} minute${
      timeUntilExpirationAsTuple.minutes > 1 ? 's' : ''
    }`;
  } else if (timeUntilExpiration < 0) {
    countdownColor = StateColor.ERROR;
    countdownDisplay = `Offer has expired`;
  }

  return (
    <Typography color={countdownColor} variant="caption">
      {countdownDisplay}
    </Typography>
  );
}
