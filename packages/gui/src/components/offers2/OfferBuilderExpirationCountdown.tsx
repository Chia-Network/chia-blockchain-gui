import { stateTextSx } from '@chia-network/core';
import { t } from '@lingui/macro';
import { Typography } from '@mui/material';
import React from 'react';

import { getOfferExpirationTimeAsTuple } from '../../hooks/useOfferExpirationDefaultTime';

export default function OfferBuilderExpirationCountdown(currentTime, expirationTime, isCaption?) {
  const timeUntilExpiration = expirationTime - currentTime;
  const timeUntilExpirationAsTuple = getOfferExpirationTimeAsTuple(timeUntilExpiration);

  // Captions carry the state color; the body text keeps the normal text color.
  let countdownState: keyof typeof stateTextSx | undefined = isCaption ? 'success' : undefined;
  let countdownDisplay = null;

  if (timeUntilExpiration > 86_399) {
    countdownDisplay = t`Offer will expire in ${timeUntilExpirationAsTuple.days} ${
      timeUntilExpirationAsTuple.days > 1 ? `days` : `day`
    }`;
  } else if (timeUntilExpiration > 3599) {
    countdownState = isCaption ? 'warning' : countdownState;
    countdownDisplay = t`Offer will expire in ${timeUntilExpirationAsTuple.hours} ${
      timeUntilExpirationAsTuple.hours > 1 ? `hours` : `hour`
    }`;
  } else if (timeUntilExpiration > 59) {
    countdownState = isCaption ? 'warning' : countdownState;
    countdownDisplay = t`Offer will expire in ${timeUntilExpirationAsTuple.minutes} ${
      timeUntilExpirationAsTuple.minutes > 1 ? `minutes` : `minute`
    }`;
  } else if (timeUntilExpiration < 0) {
    countdownState = isCaption ? 'error' : countdownState;
    countdownDisplay = t`Offer has expired`;
  }

  return (
    <Typography sx={countdownState ? stateTextSx[countdownState] : undefined} variant={isCaption ? 'caption' : 'body2'}>
      {countdownDisplay}
    </Typography>
  );
}
