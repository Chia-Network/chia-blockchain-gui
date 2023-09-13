import { StateColor } from '@chia-network/core';
import { t } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

import { getOfferExpirationTimeAsTuple } from '../../hooks/useOfferExpirationDefaultTime';

export default function OfferBuilderExpirationCountdown(currentTime, expirationTime, isCaption?) {
  const timeUntilExpiration = expirationTime - currentTime;
  const timeUntilExpirationAsTuple = getOfferExpirationTimeAsTuple(timeUntilExpiration);

  let countdownColor = isCaption ? StateColor.SUCCESS : StateColor.INFO;
  let countdownDisplay = null;

  if (timeUntilExpiration > 86_399) {
    countdownDisplay = t`Offer will expire in ${timeUntilExpirationAsTuple.days} ${
      timeUntilExpirationAsTuple.days > 1 ? `days` : `day`
    }`;
  } else if (timeUntilExpiration > 3599) {
    countdownColor = isCaption ? StateColor.WARNING : countdownColor;
    countdownDisplay = t`Offer will expire in ${timeUntilExpirationAsTuple.hours} ${
      timeUntilExpirationAsTuple.hours > 1 ? `hours` : `hour`
    }`;
  } else if (timeUntilExpiration > 59) {
    countdownColor = isCaption ? StateColor.WARNING : countdownColor;
    countdownDisplay = t`Offer will expire in ${timeUntilExpirationAsTuple.minutes} ${
      timeUntilExpirationAsTuple.minutes > 1 ? `minutes` : `minute`
    }`;
  } else if (timeUntilExpiration < 0) {
    countdownColor = isCaption ? StateColor.ERROR : countdownColor;
    countdownDisplay = t`Offer has expired`;
  }

  return (
    <Typography color={countdownColor} variant={isCaption ? 'caption' : 'body2'}>
      {countdownDisplay}
    </Typography>
  );
}
